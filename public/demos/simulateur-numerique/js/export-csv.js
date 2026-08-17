"use strict";

// ---- Export CSV des graphes (bloc explicatif + tableau de valeurs) ----
// Cellule CSV : guillemets si séparateur/guillemet/saut de ligne présent, guillemets doublés
const csvCell = v => { const s = String(v ?? ''); return /[;"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s; };
// Nombre pour Excel FR : virgule décimale, pas de séparateur de milliers
// 6 décimales max (et non 2) : préserve les petits tonnages (Lithium 0,2338 t) et les % à 3 décimales
const csvNum = n => String(Math.round((Number.isFinite(n)?n:0)*1e6)/1e6).replace('.', ',');
/**
 * Construit un CSV : bloc d'en-tête explicatif puis tableau (categoryHeader + seriesHeaders, rows de nombres bruts).
 * @param {Object} meta {title, description, unit, context, categoryHeader, seriesHeaders, rows}
 * @returns {string} contenu CSV (séparateur « ; », CRLF)
 */
function buildCsv({title, description, unit, context, categoryHeader, seriesHeaders, rows}){
  const meta = [
    ['Titre', title], ['Description', description], ['Unité', unit],
    ['Contexte', context], ['Date d\'export', new Date().toISOString().slice(0,10)],
  ];
  const lines = meta.map(r => r.map(csvCell).join(';'));
  lines.push('');
  lines.push([categoryHeader, ...seriesHeaders].map(csvCell).join(';'));
  for(const r of rows) lines.push(r.map((c,i)=> i===0 ? csvCell(c) : csvNum(c)).join(';'));
  return lines.join('\r\n');
}
/**
 * Déclenche le téléchargement d'un CSV (BOM UTF-8 pour Excel).
 * @param {string} filename
 * @param {string} csv
 */
function downloadCsv(filename, csv){
  const blob = new Blob(['﻿'+csv], {type:'text/csv;charset=utf-8'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}
/**
 * Transpose générique d'un graphe Chart.js : labels (catégories) × datasets (séries).
 * @param {Chart} chart
 * @returns {{seriesHeaders: string[], rows: Array<Array>}}
 */
function chartToTable(chart){
  const labels = chart.data.labels || [];
  const ds = chart.data.datasets || [];
  const seriesHeaders = ds.map((d,i)=> d.label || (ds.length===1 ? 'Valeur' : 'Série '+(i+1)));
  const rows = labels.map((lab,j)=> [lab, ...ds.map(d=> d.data[j] ?? 0)]);
  return {seriesHeaders, rows};
}
/**
 * Graphe matière×techno : tableau stable depuis la donnée source (indépendant du mode d'affichage).
 * @returns {{seriesHeaders: string[], rows: Array<Array>}}
 */
function techDataToTable(){
  const technos = [...new Set(lastTechData.filter(r=>r.valeur>0).map(r=>r.techno))].sort();
  const byMat = {};
  for(const r of lastTechData){ if(r.valeur<=0) continue;
    (byMat[r.matiere] = byMat[r.matiere] || {})[r.techno] = (byMat[r.matiere][r.techno]||0) + r.valeur; }
  const rows = Object.keys(byMat).sort().map(m => [m, ...technos.map(t=> byMat[m][t]||0)]);
  return {seriesHeaders: technos, rows};
}
// Registre : chaque entrée renvoie la meta complète au moment du clic (données/contexte à jour)
const CSV_EXPORTS = {
  donut: () => ({ chart: donutChart, title: 'Somme de Valeur par Matière',
    description: 'Masse totale (cumulée sur toute la période) par matière première.',
    unit: 'tonnes', context: PAGE_TITLE[currentPage] || '', categoryHeader: 'Matière' }),
  line: () => ({ chart: lineChart, title: 'Somme de Valeur par Année et Matière',
    description: 'Masse par matière première, pour chaque année.',
    unit: 'tonnes', context: PAGE_TITLE[currentPage] || '', categoryHeader: 'Année' }),
  lineSmall: () => ({ chart: lineSmallChart, title: 'Matières à faible valeur',
    description: 'Masse par année, limitée aux matières dont le total sur la période est dans la plage de tonnage choisie.',
    unit: 'tonnes', context: PAGE_TITLE[currentPage] || '', categoryHeader: 'Année' }),
  tree: () => ({ table: techDataToTable(), title: 'Répartition par matière et technologie',
    description: 'Masse par matière première, ventilée par technologie (cumul sur la période).',
    unit: 'tonnes', context: PAGE_TITLE[currentPage] || '', categoryHeader: 'Matière' }),
  soutLine: () => ({ chart: soutLineChart, title: 'Évolution du besoin moyen par an vs production mondiale',
    description: 'Besoin annuel (flux entrants) rapporté à la production mondiale de la matière, par année.',
    unit: '% (besoin / production mondiale)',
    context: 'Matière : ' + (document.getElementById('soutMatSel')?.value || ''), categoryHeader: 'Année' }),
  soutHeatmap: () => {
    const {matieres, years, valeurs} = soutHeatmapData(YEARS.filter(y=>y>=sel.yStart && y<=sel.yEnd));
    return { table: { seriesHeaders: years, rows: matieres.map(m => [m, ...years.map(y=>valeurs[m][y])]) },
      title: 'Tension d\'approvisionnement par matière et par année',
      description: 'Besoin annuel (flux entrants) rapporté à la production mondiale, pour chaque matière et chaque année.',
      unit: '% (besoin / production mondiale)', context: '', categoryHeader: 'Matière' };
  },
  term: () => ({ chart: termChart, title: 'Nombre de terminaux en circulation',
    description: 'Nombre d\'appareils détenus par les national, par type d\'appareil et par année.',
    unit: 'millions d\'appareils', context: 'Trajectoire : ' + scenarioNom(), categoryHeader: 'Année' }),
  comp: () => ({ chart: compChart, title: 'Comparaison des cinq trajectoires',
    description: 'Même grandeur projetée sous chacune des trajectoires d\'équipement.',
    unit: COMP_DEFS[compMode] ? COMP_DEFS[compMode].titre : '',
    context: 'Grandeur : ' + (COMP_DEFS[compMode] ? COMP_DEFS[compMode].titre : ''), categoryHeader: 'Année' }),
  elec: () => ({ chart: elecChart, title: 'Consommation électrique du numérique',
    description: 'Consommation annuelle des terminaux, des réseaux et des centres de données.',
    unit: 'TWh', context: 'Trajectoire : ' + scenarioNom(), categoryHeader: 'Année' }),
  dv: () => ({ chart: dvChart, title: 'Effet de la durée de vie sur le besoin de matière',
    description: 'Besoin annuel de matière neuve selon plusieurs durées de vie, à équipement inchangé.',
    unit: 'tonnes', context: 'Trajectoire : ' + scenarioNom(), categoryHeader: 'Année' }),
};
// Écouteur délégué unique : lit data-export, garde-fou si graphe non dessiné, télécharge
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-export]'); if(!btn) return;
  const build = CSV_EXPORTS[btn.dataset.export]; if(!build) return;
  const m = build();
  if(!m.table && !m.chart){ setStatus('Ce graphe n\'est pas encore affiché — ouvre l\'onglet correspondant puis réessaie.', true); return; }
  const {seriesHeaders, rows} = m.table || chartToTable(m.chart);
  if(!rows.length){ setStatus('Aucune donnée à exporter pour ce graphe.', true); return; }
  const csv = buildCsv({...m, seriesHeaders, rows});
  const slug = btn.dataset.export;
  downloadCsv(`simulateurNumerique_${slug}_${new Date().toISOString().slice(0,10)}.csv`, csv);
});
