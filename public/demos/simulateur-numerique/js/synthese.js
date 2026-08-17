"use strict";

// ---- Onglet « Synthèse » : les chiffres clés et la comparaison des trajectoires ----

let compMode = 'term';               // grandeur comparée : term · stock · entrants · elec
let synthParcChart = null;
let tonnageAutresCache = {};

/**
 * Tonnages des réseaux et des centres de données, par type de flux et par année.
 * Ces postes ne suivent pas le nombre de terminaux, mais ils changent bien d'une
 * trajectoire à l'autre dans le classeur : on lit l'export de la trajectoire demandée.
 * @param {string} [sid] trajectoire (défaut : celle affichée)
 * @returns {Object} type → série annuelle (tonnes)
 */
function tonnageAutresParType(sid){
  const cle = sid || scenNum.id;
  if(tonnageAutresCache[cle]) return tonnageAutresCache[cle];
  const out = {};
  const d = scenData[cle];
  if(d){
    for(const row of d.rows){
      const serie = out[row.t] || (out[row.t] = new Array(YEARS.length).fill(0));
      for(let k=0;k<YEARS.length;k++) serie[k] += (row.v[k] || 0) * regionRatio;
    }
  } else {
    for(const r of baseRecords){
      if(r.energie === 'Terminaux') continue;
      const serie = out[r.type] || (out[r.type] = new Array(YEARS.length).fill(0));
      serie[r.annee - YEAR_MIN] += r.valeur;
    }
  }
  tonnageAutresCache[cle] = out;
  return out;
}

/**
 * Masse totale du numérique pour un type de flux, sous une trajectoire donnée.
 * @param {string} type 'Stock' · 'Flux entrants' · 'Flux sortants'
 * @param {Object} term séries de terminaux de la trajectoire (cf. computeTerm)
 * @returns {number[]} tonnes par année
 */
function tonnageTotalSerie(type, term, sid){
  const base = tonnageBaseParAppareil()[type] || {};
  const autres = tonnageAutresParType(sid)[type] || new Array(YEARS.length).fill(0);
  const champ = RATIO_KEY[type];
  return YEARS.map((_,k)=>{
    let t = autres[k];
    for(const label in base){
      const ref = termRef[label] && termRef[label][champ][k];
      const cur = term[label] && term[label][champ][k];
      t += ref > 0 ? base[label][k] * (cur/ref) : (termRef[label] ? 0 : base[label][k]);
    }
    return t;
  });
}

/** Nombre total de terminaux d'une trajectoire, par année. */
function termTotalSerie(term){
  return YEARS.map((_,k)=>{
    let s = 0;
    for(const label in term) s += term[label].stock[k] || 0;
    return s;
  });
}

/** Consommation électrique totale d'une trajectoire, par année (TWh). */
function elecTotalSerie(term, sid){
  const d = scenData[sid || scenNum.id];
  const ref = d ? termOfScenario(sid || scenNum.id) : termRef;
  const out = new Array(YEARS.length).fill(0);
  for(const row of (d ? d.elec : elecBase)){
    for(let k=0;k<out.length;k++){
      let ratio = 1;
      if(row.e === 'Terminaux'){
        const r = ref[row.te] && ref[row.te].stock[k];
        const cur = term[row.te] && term[row.te].stock[k];
        ratio = r > 0 ? cur/r : 1;
      }
      out[k] += (row.v[k] || 0) * ratio * (d ? regionRatio : 1);
    }
  }
  return out;
}

const COMP_DEFS = {
  term:     {titre:'Terminaux en circulation', fmt:fmtUnites,  suffixe:' appareils', serie:(t,s)=>termTotalSerie(t)},
  stock:    {titre:'Matière mobilisée',        fmt:fmtTShort,  suffixe:'',           serie:(t,s)=>tonnageTotalSerie('Stock', t, s)},
  entrants: {titre:'Besoin de matière neuve',  fmt:fmtTShort,  suffixe:' par an',    serie:(t,s)=>tonnageTotalSerie('Flux entrants', t, s)},
  elec:     {titre:'Électricité consommée',    fmt:fmtTWh,     suffixe:' par an',    serie:(t,s)=>elecTotalSerie(t, s)},
};
// SCEN_COLORS vit dans js/simulateurNumerique.js : couleurs partagées boutons ↔ graphe de comparaison.

/** Rend la page Synthèse : chiffres clés, terminaux, démographie, comparateur et composition du parc. */
function renderSynthese(){
  renderSynthKpis();
  drawTermChart();
  drawDemo();
  drawCompChart();
  drawSynthParc();
}

/** Chiffres clés de la trajectoire courante. */
function renderSynthKpis(){
  const host = document.getElementById('synthKpis');
  if(!host) return;
  const kFin = YEARS.length - 1;
  const parc = terminauxTotal(YEAR_MAX);
  const stock = tonnageTotalSerie('Stock', termCur);
  const entrants = tonnageTotalSerie('Flux entrants', termCur);
  const elec = elecTotalSerie(termCur);
  const besoinMoyen = entrants.reduce((a,b)=>a+b,0) / entrants.length;
  const pop = popFrance[kFin] || 68e6;

  const kpis = [
    ['Terminaux en circulation en 2050', fmtUnites(parc), `soit ${(parc/pop).toLocaleString('fr-FR',{maximumFractionDigits:1})} appareils par habitant`],
    ['Matière mobilisée en 2050', fmtTShort(stock[kFin]), `soit ${(stock[kFin]/pop*1000).toLocaleString('fr-FR',{maximumFractionDigits:1})} kg par habitant`],
    ['Besoin de matière neuve', fmtTShort(besoinMoyen)+' / an', 'moyenne sur 2025-2050'],
    ['Électricité consommée en 2050', fmtTWh(elec[kFin]), `soit ${pct(elec[kFin]/prodElecTerritoire()*100,1)} de la production ${territoireNom()==="Territoire national"?"nationale":"régionale"}`],
    ['Trajectoire affichée', scenarioNom(), 'modifiable dans l’onglet Paramètres'],
  ];
  host.innerHTML = kpis.map(([lab,val,sub])=>
    `<div class="kpi"><div class="label">${esc(lab)}</div><div class="value">${esc(val)}</div><div class="sub">${esc(sub)}</div></div>`).join('');
}

/** Superpose les cinq trajectoires sur la grandeur choisie. */
function drawCompChart(){
  const def = COMP_DEFS[compMode];
  const series = scenList.map(s=>({
    id:s.id, nom:s.nom,
    data: def.serie(s.id === scenNum.id ? termCur : termOfScenario(s.id), s.id),
  }));

  if(compChart) compChart.destroy();
  compChart = new Chart(document.getElementById('compChart'), {
    type:'line',
    data:{labels:YEARS, datasets:series.map(s=>({
      label:s.nom, data:s.data, borderColor:SCEN_COLORS[s.id]||'#555',
      borderWidth: s.id===scenNum.id ? 3.5 : 2, borderDash: s.id===scenNum.id ? [] : [4,3],
      fill:false, pointRadius:0, tension:.25}))},
    options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
      scales:{x:{ticks:{maxRotation:0, autoSkip:true}}, y:{beginAtZero:true, ticks:{callback:v=>def.fmt(v)}}},
      plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${def.fmt(c.parsed.y)}${def.suffixe}`}}}}
  });
  fillSrTable('compTable', ['Trajectoire', ...YEARS.map(String)],
    series.map(s=>[s.nom, ...s.data.map(v=>def.fmt(v))]));

  // écart à 2050, lu par rapport à la trajectoire de maintien (base du modèle)
  const host = document.getElementById('compEcart');
  if(host){
    const kFin = YEARS.length - 1;
    const ref = series.find(s=>s.id === baseScen);
    const base2050 = ref ? ref.data[kFin] : 0;
    host.innerHTML = series.map(s=>{
      const v = s.data[kFin];
      const rel = base2050 > 0 ? v/base2050 : 1;
      const txt = s.id === baseScen ? 'référence'
        : (Math.abs(rel-1) < 0.005 ? 'même niveau'
          : (rel > 1 ? '× '+rel.toLocaleString('fr-FR',{maximumFractionDigits:2})
                     : '− '+pct((1-rel)*100, 0)));
      return `<div class="ecart"><div class="ecart-lab">${esc(s.nom)}</div>`
        + `<div class="ecart-val" style="color:${SCEN_COLORS[s.id]||'#555'}">${esc(def.fmt(v))}</div>`
        + `<div class="ecart-sub">${esc(txt)}</div></div>`;
    }).join('');
  }
  document.querySelectorAll('[data-comp]').forEach(b=>b.classList.toggle('active', b.dataset.comp===compMode));
}

/** Composition du parc d'appareils en 2050. */
function drawSynthParc(){
  const entries = terminauxParAppareil(YEAR_MAX);
  const labels = entries.map(e=>e[0]), values = entries.map(e=>e[1]);
  if(synthParcChart) synthParcChart.destroy();
  synthParcChart = new Chart(document.getElementById('synthParc'), {
    type:'doughnut',
    data:{labels, datasets:[{data:values, backgroundColor:labels.map((_,i)=>PALETTE[i%PALETTE.length]),
      borderWidth:1, borderColor:'#fff'}]},
    options:{responsive:true, maintainAspectRatio:false, cutout:'52%', layout:{padding:{top:4,right:6}},
      plugins:{legend:{position:'right', labels:{boxWidth:10, padding:5, font:{size:10}}},
        tooltip:{callbacks:{label:c=>{ const t=c.dataset.data.reduce((a,b)=>a+b,0)||1;
          return `${c.label} : ${fmtUnites(c.parsed)} appareils (${(c.parsed/t*100).toFixed(1)} %)`; }}}}}
  });
}
