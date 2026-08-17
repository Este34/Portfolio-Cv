"use strict";

// ---- Moteur Simulateur numérique : trajectoires d'équipement et nombre de terminaux ----
//
// Le classeur projette l'équipement numérique des national puis en déduit la matière.
// Ce fichier rejoue cette chaîne dans le navigateur, avec les formules du classeur :
//
//   stock(appareil, y)  = Σ_profil base[profil][y] × (1 + (f−1) · c(y))
//   dv(appareil, y)     = dv2025 × (1 + (fdv−1) · (y−2025)/25)
//   entrée(y)           = max( stock(y) − stock(y−1) + stock(y−1)/dv(y−1), 0 )
//   sortie(y)           = stock(y−1)/dv(y−1) + max( stock(y−1) − stock(y) − stock(y−1)/dv(y−1), 0 )
//
// `base` est le stock de la trajectoire de référence T2 décomposé par profil. T2 applique
// un facteur de 1 partout : sa décomposition est donc le terme « équipement 2025 ×
// population » du classeur. `c(y)` vaut (y−2025)/25 sauf pour les appareils comptés par
// foyer, qui saturent (voir generer_data.py).
//
// La matière suit ensuite le nombre de terminaux : l'intensité matière d'un appareil est
// constante dans le classeur (vérifié sur toutes les années). Les tonnages d'une
// trajectoire valent donc ceux de T2 multipliés par le rapport des nombres de terminaux.

let termData = null;                 // {appareils, base, public, fac, facDV, shapes}
let scenList = [];                   // [{id, nom}]
// Référence des tonnages : la trajectoire que contient la feuille PowerBI du classeur.
// Ce n'est pas toujours la trajectoire de base — le générateur la détecte (cf. generer_data.py).
let refScen = 'T2';
// Trajectoire de base du modèle (facteurs = 1) : point de départ de T′ et sélection initiale.
let baseScen = 'T2';

// Couleur de chaque trajectoire, partagée par les boutons et le graphe de comparaison.
const SCEN_COLORS = { T1:'#2e7d32', T2:'#4e79a7', T3:'#f28e2b', T4:'#c0392b', TP:'#7f4fa8' };

// Descriptions courtes par trajectoire, affichées sur les boutons (placeholders à faire relire).
const SCEN_INFO = {
  T1: "Sobriété : moins d'appareils, gardés plus longtemps.",
  T2: "Référence : les usages et durées de vie d'aujourd'hui, prolongés.",
  T3: "Numérisation accrue : davantage d'équipement par personne.",
  T4: "Trajectoire cible : cible du projet Simulateur numérique.",
  TP: "À écrire : pars d'une trajectoire, puis ajuste les facteurs toi-même.",
};

// Comme le classeur : T1–T4 sont des trajectoires de référence FIGÉES (on les sélectionne).
// T′ (« TP ») est la SEULE trajectoire éditable ; on la « seed » depuis une référence
// (macros T_S1…T_S4) puis on modifie ses facteurs. Son état survit au passage par T1–T4.
const libreState = { fac: {}, facDV: {}, base: 'T2', edited: false };
// id : trajectoire active (T1..T4 ou 'TP') · base : origine du seed de T′ · editable : T′ seule
const scenNum = { id: 'T2', base: 'T2', editable: false, fac: {}, facDV: {} };   // fac[profil][appareil] · facDV[appareil]

let termRef = null;                  // séries de la trajectoire de référence (dénominateur)
let termCur = null;                  // séries de la trajectoire courante
let elecBase = [];                   // lignes d'électricité brutes du classeur

// Données exactes par trajectoire, exportées du classeur (macro Exporter_Tous_Scenarios).
// Chaque macro du classeur réécrit toute la feuille PowerBI : réseaux et électricité des
// datacenters changent aussi, pas seulement les terminaux. Ces exports les portent ; les
// terminaux, eux, restent dérivés du modèle (vérifié exact contre ces mêmes exports).
// Les séries y sont NATIONALES : elles sont ramenées au territoire à l'usage.
let scenData = {};                   // sid → {rows:[lignes hors modèle], elec:[...]}
let termExport = null;               // séries de la trajectoire dont l'export est utilisé
let modelisesSet = new Set();         // appareils portés par le modèle (hors écrans publics)

const SPAN = YEAR_MAX - YEAR_MIN;    // 25 ans
const LINEAIRE = YEARS.map((_, k) => k / SPAN);

/** Copie profonde d'un objet de facteurs (deux niveaux). */
const cloneFac = src => Object.fromEntries(
  Object.entries(src || {}).map(([p, m]) => [p, { ...m }]));

/**
 * Charge une trajectoire du classeur dans l'état éditable.
 * @param {string} id identifiant de trajectoire (T1..T4, TP)
 */
function setScenario(id) {
  if (!termData || !termData.fac[id]) return;
  if (id === 'TP') { activerLibre(); return; }   // T′ : trajectoire éditable persistante
  scenNum.id = id;
  scenNum.base = id;
  scenNum.editable = false;
  scenNum.fac = cloneFac(termData.fac[id]);
  scenNum.facDV = { ...termData.facDV[id] };
}

/** Initialise T′ sur la trajectoire de base (colonne « T' Input » du classeur, vide donc = T2). */
function initLibre() {
  if (!termData) return;
  libreState.fac = cloneFac(termData.fac.TP || termData.fac[baseScen] || {});
  libreState.facDV = { ...(termData.facDV.TP || termData.facDV[baseScen] || {}) };
  libreState.base = baseScen;
  libreState.edited = false;
}

/** Active T′ : ses facteurs (persistants et éditables) deviennent l'état de calcul courant. */
function activerLibre() {
  scenNum.id = 'TP';
  scenNum.base = libreState.base;
  scenNum.editable = true;
  scenNum.fac = libreState.fac;      // même référence : les éditions mettent à jour libreState
  scenNum.facDV = libreState.facDV;
}

/** Recharge T′ depuis une trajectoire de référence choisie (équivaut aux macros T_S1…T_S4). */
function seedLibreFrom(refId) {
  if (!termData || !termData.fac[refId]) return;
  libreState.fac = cloneFac(termData.fac[refId]);
  libreState.facDV = { ...termData.facDV[refId] };
  libreState.base = refId;
  libreState.edited = false;
  activerLibre();
  recompute();
}

/** Vrai si la trajectoire active est éditable (uniquement T′ Libre). */
const scenEditable = () => scenNum.id === 'TP';

/** Parc total (nombre de terminaux) en 2050 d'une trajectoire du classeur — info des boutons. */
function parc2050(id) {
  const t = termOfScenario(id);
  const k = YEAR_MAX - YEAR_MIN;
  let s = 0;
  for (const label in t) s += (t[label].stock[k] || 0);
  return s;
}

/**
 * Signale que l'utilisateur a modifié un facteur de T′. La trajectoire de départ (le seed)
 * reste mémorisée pour le retour aux valeurs d'origine.
 */
function markScenarioLibre() {
  libreState.edited = true;
}

/** Nom affichable de la trajectoire courante. */
function scenarioNom() {
  if (scenNum.id === 'TP') {
    const baseNom = (scenList.find(x => x.id === libreState.base) || {}).nom || libreState.base;
    return libreState.edited ? `T′ Libre personnalisée — départ ${baseNom}` : `T′ Libre — départ ${baseNom}`;
  }
  const s = scenList.find(x => x.id === scenNum.id);
  return s ? s.nom : 'Trajectoire';
}

/**
 * Courbe de montée en charge d'un appareil dans un profil.
 * @param {string} label appareil
 * @param {string} profil profil (tranche d'âge × usage)
 * @param {number} f facteur d'équipement
 * @returns {number[]} coefficient par année, de 0 en 2025 à 1 en 2050
 */
function shapeFor(label, profil, f) {
  const s = termData.shapes && termData.shapes[label] && termData.shapes[label][profil];
  if (!s) return LINEAIRE;
  return f >= 1 ? s.up : s.down;
}

/**
 * Série annuelle du nombre de terminaux d'un appareil.
 * @param {string} label appareil
 * @param {Object} fac facteurs d'équipement par profil
 * @returns {number[]} nombre d'appareils par année
 */
function stockSerie(label, fac) {
  const base = termData.base[label] || {};
  const out = new Array(YEARS.length).fill(0);
  for (const profil in base) {
    const serie = base[profil];
    const f = (fac[profil] && fac[profil][label] != null) ? fac[profil][label] : 1;
    const c = shapeFor(label, profil, f);
    for (let k = 0; k < out.length; k++) out[k] += serie[k] * (1 + (f - 1) * c[k]);
  }
  return out;
}

/**
 * Série annuelle de la durée de vie d'un appareil.
 * @param {number} dv2025 durée de vie en 2025 (années)
 * @param {number} fdv facteur d'évolution à 2050
 * @returns {number[]}
 */
function dvSerie(dv2025, fdv) {
  // plancher à un mois : le flux de remplacement divise par la durée de vie, une valeur
  // nulle ferait diverger le calcul
  return YEARS.map((_, k) => Math.max(dv2025 * (1 + (fdv - 1) * k / SPAN), 1 / 12));
}

/** Flux entrant annuel : renouvellement du parc plus croissance du parc. */
function fluxEntrantSerie(stock, dv) {
  const out = new Array(stock.length).fill(0);
  for (let k = 1; k < stock.length; k++) {
    const prev = stock[k - 1], remp = dv[k - 1] > 0 ? prev / dv[k - 1] : 0;
    out[k] = Math.max(stock[k] - prev + remp, 0);
  }
  return out;
}

/** Flux sortant annuel : appareils remplacés plus appareils retirés sans remplacement. */
function fluxSortantSerie(stock, dv) {
  const out = new Array(stock.length).fill(0);
  // 2025 n'a pas d'année précédente : le classeur y compte le seul renouvellement du parc,
  // stock(2025) / durée de vie(2025). L'oublier retirait une année entière au flux sortant.
  out[0] = dv[0] > 0 ? stock[0] / dv[0] : 0;
  for (let k = 1; k < stock.length; k++) {
    const prev = stock[k - 1], remp = dv[k - 1] > 0 ? prev / dv[k - 1] : 0;
    out[k] = remp + Math.max(prev - stock[k] - remp, 0);
  }
  return out;
}

/**
 * Séries complètes d'une trajectoire, tous appareils confondus.
 * @param {Object} fac facteurs d'équipement
 * @param {Object} facDV facteurs de durée de vie
 * @returns {Object} label → {stock, dv, entrants, sortants}
 */
function computeTerm(fac, facDV) {
  const out = {};
  for (const a of termData.appareils) {
    const stock = stockSerie(a.id, fac);
    const dv = dvSerie(a.dv, facDV[a.id] != null ? facDV[a.id] : 1);
    out[a.id] = { stock, dv, entrants: fluxEntrantSerie(stock, dv), sortants: fluxSortantSerie(stock, dv) };
  }
  for (const p of termData.public) {
    out[p.id] = { stock: p.stock, dv: null, entrants: p.flux, sortants: p.flux };
  }
  return out;
}

/** Nombre total de terminaux en circulation à l'année y. */
function terminauxTotal(y) {
  const k = y - YEAR_MIN;
  let s = 0;
  for (const label in termCur) s += termCur[label].stock[k] || 0;
  return s;
}

/**
 * Nombre de terminaux par appareil, trié par ordre décroissant sur l'année demandée.
 * @param {number} y année
 * @returns {Array<[string, number]>}
 */
function terminauxParAppareil(y) {
  const k = y - YEAR_MIN;
  return Object.keys(termCur)
    .map(label => [label, termCur[label].stock[k] || 0])
    .filter(e => e[1] > 0)
    .sort((a, b) => b[1] - a[1]);
}

/** Séries d'une trajectoire du classeur, sans toucher à l'état courant. */
function termOfScenario(id) {
  return computeTerm(termData.fac[id] || {}, termData.facDV[id] || {});
}

const RATIO_KEY = { 'Stock': 'stock', 'Flux entrants': 'entrants', 'Flux sortants': 'sortants' };

/**
 * Rapport entre la trajectoire courante et la référence, pour un appareil et un type de flux.
 * Vaut 1 quand la trajectoire courante est celle du classeur, ou quand l'appareil ne dépend
 * pas des trajectoires (écrans publics, réseaux, datacenters).
 */
function ratioTerm(label, type, k) {
  const cur = termCur[label], ref = termRef[label];
  if (!cur || !ref) return 1;
  const champ = RATIO_KEY[type];
  if (!champ) return 1;
  const d = ref[champ][k];
  return d > 0 ? cur[champ][k] / d : (cur[champ][k] > 0 ? 1 : 0);
}

/**
 * Régénère `records` : tonnages de la référence, remis à l'échelle du nombre de terminaux
 * de la trajectoire courante. Les lignes Réseaux et Datacenters sont inchangées : le
 * classeur ne les fait pas dépendre des trajectoires d'équipement.
 */
function recompute() {
  if (!baseRecords.length || !termData) return;
  termCur = computeTerm(scenNum.fac, scenNum.facDV);
  // trajectoire dont on utilise l'export : sert de dénominateur quand T′ est éditée
  termExport = scenData[scenNum.id] ? termOfScenario(scenNum.id) : null;

  const d = scenData[scenNum.id];
  const out = [];
  for (const r of baseRecords) {
    if (r.energie !== 'Terminaux') continue;
    // avec un export, les appareils hors modèle (écrans d'usage public) en viennent :
    // les reprendre ici aussi les compterait deux fois
    if (d && !modelisesSet.has(r.techno)) continue;
    const ratio = ratioTerm(r.techno, r.type, r.annee - YEAR_MIN);
    out.push(ratio === 1 ? { ...r } : { ...r, valeur: r.valeur * ratio });
  }
  records = out.concat(recordsHorsModele());
  updateScenBadge();
}

/**
 * Tout ce que le modèle ne porte pas : réseaux, centres de données et écrans d'usage
 * public, à l'échelle du territoire. Ces postes ne se déduisent pas du nombre de terminaux :
 * on prend l'export exact de la trajectoire quand il existe, sinon les lignes de référence.
 * @returns {Array<Object>} enregistrements au format de `records`
 */
function recordsHorsModele() {
  const d = scenData[scenNum.id];
  if (!d) return baseRecords.filter(r => r.energie !== 'Terminaux').map(r => ({ ...r }));
  const out = [];
  for (const row of d.rows) {
    for (let k = 0; k < YEARS.length; k++) {
      out.push({ type: row.t, energie: row.e, techno: row.te, matiere: row.m,
                 annee: YEAR_MIN + k, valeur: (row.v[k] || 0) * regionRatio });
    }
  }
  return out;
}

/**
 * Rapport entre la trajectoire courante et celle de l'export utilisé. Vaut 1 tant que
 * l'utilisateur n'a pas édité T′ : l'export décrit alors exactement la trajectoire.
 */
function ratioVsExport(label, type, k) {
  if (!termExport) return 1;
  const cur = termCur[label], ref = termExport[label];
  if (!cur || !ref) return 1;
  const champ = RATIO_KEY[type];
  if (!champ) return 1;
  const d = ref[champ][k];
  return d > 0 ? cur[champ][k] / d : (cur[champ][k] > 0 ? 1 : 0);
}

/**
 * Consommation électrique du numérique, remise à l'échelle de la trajectoire courante.
 * Seuls les terminaux réagissent : leur consommation suit le nombre d'appareils. La
 * consommation unitaire d'un appareil reste celle de la trajectoire de référence.
 * @returns {Object} thème → série annuelle en TWh
 */
function elecParTheme() {
  const d = scenData[scenNum.id];
  const out = {};
  // avec un export : consommation exacte de la trajectoire (datacenters compris, qui
  // varient beaucoup d'une trajectoire à l'autre) ; le ratio ne joue que si T′ est éditée
  for (const row of (d ? d.elec : elecBase)) {
    const serie = out[row.e] || (out[row.e] = new Array(YEARS.length).fill(0));
    for (let k = 0; k < serie.length; k++) {
      const ratio = row.e === 'Terminaux'
        ? (d ? ratioVsExport(row.te, 'Stock', k) : ratioTerm(row.te, 'Stock', k)) : 1;
      serie[k] += (row.v[k] || 0) * ratio * (d ? regionRatio : 1);
    }
  }
  return out;
}

/** Met à jour la pastille « trajectoire active ». */
function updateScenBadge() {
  const b = document.getElementById('activeScenarioBadge');
  if (b) b.textContent = scenarioNom();
}

/** Remet T′ sur les valeurs de sa trajectoire de départ (le seed). Sans effet sur les références. */
function resetScenario() {
  if (scenNum.id === 'TP') { seedLibreFrom(libreState.base); return; }
  setScenario(scenNum.base);
  recompute();
}
