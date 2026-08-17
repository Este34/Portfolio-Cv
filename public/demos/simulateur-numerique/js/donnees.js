"use strict";

/**
 * Construit le modèle et l'UI à partir de baseRecords + globals déjà fixés, puis affiche l'application.
 */
function finishLoad(){
  records = baseRecords.map(r=>({...r}));
  buildDims();
  buildUI();
  document.getElementById('status').style.display='none';   // fini le message de chargement
  document.getElementById('app').style.display='grid';
  document.getElementById('tabs').style.display='flex';
  document.getElementById('scenBar').classList.add('ready');
  recompute();   // applique la trajectoire courante
  updateRegionUI();
  render();
}

/**
 * Charge le jeu de données embarqué (energie-data.json) et initialise les globals.
 * @param {Object} ds jeu de données version 2 : lignes matière du scénario de référence,
 *   production mondiale des matières, démographie, et modèle terminaux (base/facteurs).
 * @throws {Error} si la version est inconnue ou le jeu vide
 */
function loadDataset(ds){
  if(ds.version !== 2) throw new Error("Format de données non supporté (version "+ds.version+").");
  const years = ds.years || YEARS;
  baseRecords = [];
  for(const row of (ds.rows||[])){
    (row.v||[]).forEach((val,i)=> baseRecords.push({type:row.t, energie:row.e, techno:row.te, matiere:row.m, annee:years[i], valeur:val||0}));
  }
  if(!baseRecords.length) throw new Error("Jeu de données embarqué vide.");
  dataDate = ds.generatedAt || null;
  updateDataInfo();

  prodMap  = ds.prodMap || {};
  if(Array.isArray(ds.seuils) && ds.seuils.length===3) SEUILS.splice(0, 3, ...ds.seuils);
  demoData = ds.demo || {};
  elecBase = ds.elec || [];
  popFrance = YEARS.map(y => Object.values(demoData)
    .reduce((s, serie) => s + (serie[String(y)] || 0), 0) || 68e6);

  scenList = ds.scenarios || [];
  refScen  = ds.refScen || 'T2';
  baseScen = ds.baseScen || refScen;
  profilList = ds.profils || [];
  termData = ds.term || null;
  if(!termData) throw new Error("Modèle terminaux absent du jeu de données.");

  scenData = ds.scenData || {};   // séries nationales exactes par trajectoire (exports)
  modelisesSet = new Set(termData.appareils.map(a=>a.id));
  regionsList = ds.regions || [{id:'fr', nom:'Territoire national', ratio:1, seuils:SEUILS.slice()}];
  snapshotNational();

  termRef = termOfScenario(refScen);
  initLibre();
  setScenario(baseScen);

  finishLoad();
}

// ---- territoire : national ↔ régional ----
// Le classeur obtient le régional en multipliant le national par le rapport de population.
// On garde donc une copie intacte des séries nationales et on en dérive le territoire courant.
let natRecords = null, natElec = null, natDemo = null, natTermBase = null, natTermPublic = null;

/** Mémorise les séries nationales, seule source de vérité pour toute mise à l'échelle. */
function snapshotNational(){
  natRecords   = baseRecords.map(r=>({...r}));
  natElec      = elecBase.map(r=>({...r, v:r.v.slice()}));
  natDemo      = Object.fromEntries(Object.entries(demoData).map(([k,s])=>[k, {...s}]));
  natTermBase  = Object.fromEntries(Object.entries(termData.base)
    .map(([lab,per])=>[lab, Object.fromEntries(Object.entries(per).map(([p,s])=>[p, s.slice()]))]));
  natTermPublic = (termData.public || []).map(p=>({...p, stock:p.stock.slice(), flux:p.flux.slice()}));
}

/**
 * Applique un territoire : met les grandeurs absolues à l'échelle et charge ses seuils.
 * La production mondiale des matières (prodMap) ne change pas — le monde reste le monde.
 * @param {string} id identifiant de territoire ('fr' | 'occ')
 */
function applyRegion(id){
  const r = regionsList.find(x=>x.id===id) || regionsList[0];
  if(!r) return;
  regionId = r.id;
  regionRatio = r.ratio;
  if(Array.isArray(r.seuils) && r.seuils.length===3) SEUILS.splice(0, 3, ...r.seuils);

  const k = regionRatio;
  baseRecords = natRecords.map(x=>({...x, valeur:x.valeur*k}));
  elecBase    = natElec.map(x=>({...x, v:x.v.map(v=>v*k)}));
  demoData    = Object.fromEntries(Object.entries(natDemo)
    .map(([lab,s])=>[lab, Object.fromEntries(Object.entries(s).map(([y,v])=>[y, v*k]))]));
  termData.base = Object.fromEntries(Object.entries(natTermBase)
    .map(([lab,per])=>[lab, Object.fromEntries(Object.entries(per).map(([p,s])=>[p, s.map(v=>v*k)]))]));
  // les écrans d'usage public ne suivent pas de trajectoire : on les met à l'échelle à part
  if(natTermPublic) termData.public = natTermPublic.map(p=>({...p,
    stock:p.stock.map(v=>v*k), flux:p.flux.map(v=>v*k)}));

  popFrance = YEARS.map(y => Object.values(demoData)
    .reduce((s, serie) => s + (serie[String(y)] || 0), 0) || 68e6*k);

  // caches de tonnages : ils dérivent de baseRecords/scenData, donc du territoire
  tonnageBaseCache = null;
  tonnageAutresCache = {};
  termRef = termOfScenario(refScen);
  recompute();
  updateRegionUI();
  render();
}

/**
 * Déduit les domaines de filtres (types/matières/énergies/technos) depuis records,
 * puis initialise couleurs et sélections par défaut.
 */
function buildDims(){
  const uniq = key => [...new Set(records.map(r=>r[key]))].filter(Boolean);
  dims.types    = uniq('type');
  dims.matieres = uniq('matiere').sort((a,b)=>a.localeCompare(b,'fr'));
  dims.energies = uniq('energie').sort();
  dims.technos  = uniq('techno').sort();
  dims.soutMatieres = dims.matieres.filter(m=>prodMap[m]>0);
  colorMap = {};
  dims.matieres.forEach((m,i)=>colorMap[m]=PALETTE[i%PALETTE.length]);
  sel.matieres = new Set(dims.matieres);
  sel.energies = new Set(dims.energies);
  sel.technos  = new Set(dims.technos);
  TYPES.entrants = dims.types.find(t=>/entrant/i.test(t));
  TYPES.sortants = dims.types.find(t=>/sortant/i.test(t));
  TYPES.stock    = dims.types.find(t=>/stock/i.test(t));
  sel.type = TYPES.stock || dims.types[0];
  sel.soutMatiere = dims.soutMatieres.find(m=>/dysprosium/i.test(m)) || dims.soutMatieres[0] || null;
}
