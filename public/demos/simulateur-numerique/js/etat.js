"use strict";

const YEAR_MIN = 2025, YEAR_MAX = 2050;
const YEARS = Array.from({length:YEAR_MAX-YEAR_MIN+1},(_,i)=>YEAR_MIN+i);

// Seuils de vigilance (part du besoin annuel dans la production mondiale), en %.
// Ils sont remplacés au chargement par ceux du classeur (feuille « Matrice TCD »).
// < Superficie territoire/Monde | < Population FR/Monde | < PIB territoire/Monde | au-dessus du PIB
const SEUILS = [0.365, 0.841, 2.170];
const BAND_COLORS = ['#5cb85c','#f4d03f','#e67e22','#c0392b'];
/** Borne haute de la jauge : couvre toujours le dernier seuil et la valeur affichée. */
const gaugeMax = v => Math.max(3, Math.ceil(Math.max(v||0, SEUILS[2]) * 1.2));

// ---- état global ----
let records = [];
let baseRecords = [];                 // tonnages du classeur (trajectoire de référence)
let dims = { types:[], matieres:[], energies:[], technos:[], soutMatieres:[] };
let prodMap = {};                     // matière → production mondiale (tonnes/an)
const TYPES = {};                     // {entrants, sortants, stock}
let currentPage = 'synthese';
let demoData = {};                    // démographie démographie de référence par tranche d'âge
let profilList = [];                  // profils éditables (tranche d'âge × usage)

// ---- territoire ----
// Le classeur décline le modèle national en régional (feuilles « PowerBI Région » /
// « Matrice TCD Occ ») : les tonnages et l'électricité y sont ceux de le territoire multipliés
// par le rapport de population. Les seuils de vigilance, eux, sont propres à la région.
let regionsList = [];                 // [{id, nom, ratio, seuils}]
let regionId = 'fr';
let regionRatio = 1;
const sel = { type:null, matieres:new Set(), energies:new Set(), technos:new Set(),
              yStart:YEAR_MIN, yEnd:YEAR_MAX, soutMatiere:null,
              smallMatMin:0, smallMatMax:6000000 };

// Population nationale de référence, pour ramener les tonnages à l'habitant.
// Elle est recalculée depuis la démographie démographie de référence au chargement.
let popFrance = YEARS.map(()=>68e6);

// Production électrique nationale, pour situer la consommation du numérique.
// Source : RTE, bilan électrique 2024 (production totale nette).
const PROD_ELEC_FR_TWH = 536.5;
/**
 * Production électrique du territoire courant : mise à l'échelle de la population, comme le
 * classeur met le reste du modèle régional à l'échelle. La « part de la production » reste
 * donc comparable d'un territoire à l'autre.
 */
const prodElecTerritoire = () => PROD_ELEC_FR_TWH * regionRatio;
/** Libellé du territoire courant, pour les phrases d'explication. */
const territoireNom = () => (regionsList.find(r=>r.id===regionId)||{}).nom || 'Territoire national';

// ---- graphiques ----
let donutChart=null, lineChart=null, lineSmallChart=null, treeChart=null;
let gaugeChart=null, soutLineChart=null, demoChart=null;
let termChart=null, compChart=null, elecChart=null, elecPartChart=null, dvChart=null;
let techChartKind=null;        // type de graphe « Répartition matière/techno » choisi (null = aucun)
let lastTechData=[];           // dernière donnée passée (pour re-render au changement de type)
let matSort='value';           // ordre des matières par valeur : 'value' (décroissant) ou 'asc' (croissant)
let lastMats=[];               // dernier ordre de matières calculé (réutilisé par les modes stackh/col)
let colorMap={};
let treeFocus=null;            // matière sur laquelle le treemap est zoomé (null = vue d'ensemble)

const PALETTE = ["#4e79a7","#f28e2b","#e15759","#76b7b2","#59a14f","#edc948","#b07aa1",
  "#ff9da7","#9c755f","#bab0ac","#1f77b4","#2ca02c","#d62728","#9467bd","#8c564b",
  "#e377c2","#17becf","#bcbd22","#7f7f7f"];

// ---- helpers ----
const norm = v => (v==null ? "" : String(v).trim());
const pct = (n,d=2) => (Number.isFinite(n)?n:0).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d})+' %';
// format « scientifique » : 2 décimales sous 1000, 1 décimale à partir de 1000 (partout)
const fmtNum = n => { const d = Math.abs(n)>=1000 ? 1 : 2;
  return (Number.isFinite(n)?n:0).toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d}); };
/**
 * Nombre complet (pas d'abréviation M/Md) : 2 décimales sous 1000, 1 au-delà (cf. fmtNum).
 * @param {number} n
 * @returns {string} nombre formaté fr-FR
 */
function fmtShort(n){ return fmtNum(n); }
// matière (Stock/Flux) : toujours en tonnes — jamais de valeur affichée sans unité
const fmtT = n => fmtNum(n)+' t';
/**
 * Tonnage compact pour axes/étiquettes serrés (mode log) : 1,2 Md t · 385,1 M t · 5 k t.
 * @param {number} n tonnes
 * @returns {string}
 */
function fmtTShort(n){
  const fmt = (x,suf) => x.toLocaleString('fr-FR',{maximumFractionDigits:1})+suf;
  const a = Math.abs(n);
  if(a>=1e9) return fmt(n/1e9,' Md t');
  if(a>=1e6) return fmt(n/1e6,' M t');
  if(a>=1e3) return fmt(n/1e3,' k t');
  return fmt(n,' t');
}
/**
 * Nombre d'appareils compact : 67,1 M · 4,3 Md · 850 k.
 * @param {number} n nombre d'unités
 * @returns {string}
 */
function fmtUnites(n){
  const fmt = (x,suf) => x.toLocaleString('fr-FR',{maximumFractionDigits:1})+suf;
  const a = Math.abs(n);
  if(a>=1e9) return fmt(n/1e9,' Md');
  if(a>=1e6) return fmt(n/1e6,' M');
  if(a>=1e3) return fmt(n/1e3,' k');
  return fmt(n,'');
}
/** Consommation électrique en TWh, une décimale. */
const fmtTWh = n => (Number.isFinite(n)?n:0).toLocaleString('fr-FR',{maximumFractionDigits:1})+' TWh';
// étiquettes de valeur au-dessus des barres (mode log : les hauteurs n'expriment pas les écarts réels)
const barValuePlugin = {
  id:'barValue',
  afterDatasetsDraw(chart){
    const meta = chart.getDatasetMeta(0); if(!meta || !meta.data) return;
    const ctx = chart.ctx; ctx.save();
    ctx.textAlign='center'; ctx.textBaseline='bottom'; ctx.fillStyle='#333'; ctx.font='9px Segoe UI,Arial';
    meta.data.forEach((bar,i)=>{ const v = chart.data.datasets[0].data[i];
      if(v==null || v<=0) return; ctx.fillText(fmtTShort(v), bar.x, bar.y-3); });
    ctx.restore();
  }
};
const round2 = n => Math.round((Number.isFinite(n)?n:0)*100)/100;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
/**
 * Remplit une table accessible (.sr-only) jouxtant un canvas.
 * @param {string} id id de la table
 * @param {string[]} headers en-têtes de colonnes
 * @param {Array<Array>} rows lignes [[cellule,...],...]
 */
function fillSrTable(id, headers, rows){
  const t = document.getElementById(id); if(!t) return;
  const head = `<thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead>`;
  const body = `<tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody>`;
  t.innerHTML = head + body;
}
// type de données déterminé par l'onglet courant (la soutenabilité force les flux entrants)
const PAGE_TYPE = { stock:'stock', entrants:'entrants', sortants:'sortants' };
const PAGE_TITLE = { stock:'Matières mobilisées', entrants:'Flux matières entrants', sortants:'Flux matières sortants' };
const effType = () => currentPage==='sout' ? TYPES.entrants
                    : (PAGE_TYPE[currentPage] ? TYPES[PAGE_TYPE[currentPage]] : TYPES.stock);
const isDataPage = () => !!PAGE_TYPE[currentPage];
const sectionId = () => isDataPage() ? 'page-data' : 'page-'+currentPage;
/** Pages qui occupent toute la largeur, sans panneau de filtres. */
const isFullPage = () => ['synthese','traj','elec'].includes(currentPage);
/**
 * Couleur de vigilance selon la part du besoin dans la production mondiale (cf. SEUILS).
 * @param {number} p pourcentage
 * @returns {string} couleur CSS
 */
function bandColor(p){ return p<SEUILS[0]?BAND_COLORS[0] : p<SEUILS[1]?BAND_COLORS[1] : p<SEUILS[2]?BAND_COLORS[2] : BAND_COLORS[3]; }
/**
 * Libellé du niveau de vigilance correspondant (cf. SEUILS).
 * @param {number} p pourcentage
 * @returns {string}
 */
function niveauLabel(p){ return p<SEUILS[0]?'sous la superficie' : p<SEUILS[1]?'sous la population' : p<SEUILS[2]?'sous le PIB' : 'au-dessus du PIB'; }

/**
 * Affiche un message dans la barre d'état (#status).
 * @param {string} msg
 * @param {boolean} [err] true = style/rôle d'alerte
 */
function setStatus(msg, err){ const s=document.getElementById('status'); s.textContent=msg; s.className=err?'err':''; s.setAttribute('role', err?'alert':'status'); }

// ---- date des données (pied de page) ----
let dataDate = null;   // generatedAt du jeu de données chargé (ISO), null si absent
/** 'YYYY-MM-DD' → 'JJ/MM/AAAA' (affichage fr). */
const fmtDateFr = iso => { const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||''); return m ? `${m[3]}/${m[2]}/${m[1]}` : (iso||''); };
/** Met à jour la ligne « Données du … » du pied de page. */
function updateDataInfo(){
  const el=document.getElementById('dataInfo'); if(!el) return;
  el.textContent = (dataDate ? 'Données du '+fmtDateFr(dataDate) : 'Données Simulateur numérique') + ' · ';
}
