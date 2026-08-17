"use strict";

// ---- Onglet « Paramètres » ----
// La page expose les deux leviers du modèle : le niveau d'équipement des national en 2050,
// et la durée de vie des appareils. Toute modification relance le calcul complet.

const DEMO_COLORS = { '-25 ans': '#4e79a7', '25-39 ans': '#59a14f', '40-59 ans': '#edc948', '60 ans et +': '#e15759' };
const TERM_TOP = 10;                 // appareils tracés individuellement, le reste est regroupé
const DV_MULTIPLICATEURS = [0.75, 1, 1.25, 1.5, 2];

let tonnageBaseCache = null;         // {type: {appareil: [26 tonnes]}} — tonnages de référence

/**
 * Tonnages du classeur agrégés par équipement et par année, tous matériaux confondus.
 * Sert à convertir un nombre de terminaux en masse sans réécrire le détail par matière.
 * @returns {Object} type → équipement → série annuelle (tonnes)
 */
function tonnageBaseParAppareil(){
  if(tonnageBaseCache) return tonnageBaseCache;
  const out = {};
  for(const r of baseRecords){
    if(r.energie !== 'Terminaux') continue;
    const parType = out[r.type] || (out[r.type] = {});
    const serie = parType[r.techno] || (parType[r.techno] = new Array(YEARS.length).fill(0));
    serie[r.annee - YEAR_MIN] += r.valeur;
  }
  tonnageBaseCache = out;
  return out;
}

/** Rend la page Paramètres : facteurs d'équipement et durée de vie. */
function renderTraj(){
  renderFacTables();
  renderDvTable();
  drawDvChart();
}

/** Aire empilée de la population nationale par tranche d'âge. */
function drawDemo(){
  const labs = Object.keys(demoData);
  if(!labs.length) return;
  const years = Object.keys(demoData[labs[0]]).map(Number).sort((a,b)=>a-b);
  const datasets = labs.map(l=>({ label:l, data:years.map(y=>(demoData[l][y]||0)/1e6),
    backgroundColor:(DEMO_COLORS[l]||'#888')+'cc', borderColor:DEMO_COLORS[l]||'#888',
    borderWidth:1, fill:true, pointRadius:0, tension:.25 }));
  if(demoChart) demoChart.destroy();
  demoChart = new Chart(document.getElementById('demoChart'), {
    type:'line', data:{labels:years, datasets},
    options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
      scales:{x:{stacked:true, ticks:{maxRotation:0, autoSkip:true}},
        y:{stacked:true, ticks:{callback:v=>v+' M'}}},
      plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${c.parsed.y.toLocaleString('fr-FR',{maximumFractionDigits:2})} M hab`}}}}
  });
}

/** Aire empilée du nombre de terminaux en circulation, par équipement. */
function drawTermChart(){
  const classement = terminauxParAppareil(YEAR_MAX);
  const tops = classement.slice(0, TERM_TOP).map(e=>e[0]);
  const autres = classement.slice(TERM_TOP).map(e=>e[0]);
  const serieDe = label => YEARS.map((_,k)=> (termCur[label] ? termCur[label].stock[k] : 0));
  const datasets = tops.map((label,i)=>({ label, data:serieDe(label).map(v=>v/1e6),
    backgroundColor:PALETTE[i%PALETTE.length]+'cc', borderColor:PALETTE[i%PALETTE.length],
    borderWidth:1, fill:true, pointRadius:0, tension:.2 }));
  if(autres.length){
    const cumul = YEARS.map((_,k)=> autres.reduce((s,l)=>s+(termCur[l]?termCur[l].stock[k]:0), 0)/1e6);
    datasets.push({ label:`Autres appareils (${autres.length})`, data:cumul,
      backgroundColor:'#bab0acaa', borderColor:'#bab0ac', borderWidth:1, fill:true, pointRadius:0, tension:.2 });
  }
  if(termChart) termChart.destroy();
  termChart = new Chart(document.getElementById('termChart'), {
    type:'line', data:{labels:YEARS, datasets},
    options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
      scales:{x:{stacked:true, ticks:{maxRotation:0, autoSkip:true}},
        y:{stacked:true, ticks:{callback:v=>v.toLocaleString('fr-FR')+' M'}}},
      plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${fmtUnites(c.parsed.y*1e6)} appareils`}}}}
  });
  fillSrTable('termTable', ['Équipement', ...YEARS.map(String)],
    tops.map(l=>[l, ...serieDe(l).map(v=>fmtUnites(v))]));

  // rappel chiffré : parc total et appareils les plus nombreux
  const host = document.getElementById('termTop');
  if(host){
    const t2025 = terminauxTotal(YEAR_MIN), t2050 = terminauxTotal(YEAR_MAX);
    const cartes = [[`Parc total en ${YEAR_MIN}`, fmtUnites(t2025)+' appareils'],
                    [`Parc total en ${YEAR_MAX}`, fmtUnites(t2050)+' appareils'],
                    ['Évolution sur la période', evolutionTexte(t2025, t2050)]];
    cartes.push(...classement.slice(0,3).map(([l,v])=>[l+` en ${YEAR_MAX}`, fmtUnites(v)+' appareils']));
    host.innerHTML = cartes.map(([lab,val])=>
      `<div class="ecart"><div class="ecart-lab">${esc(lab)}</div><div class="ecart-val">${esc(val)}</div></div>`).join('');
  }
}

/**
 * Formule d'évolution entre deux valeurs, en toutes lettres.
 * @param {number} a valeur de départ
 * @param {number} b valeur d'arrivée
 * @returns {string}
 */
function evolutionTexte(a, b){
  if(!(a > 0)) return '—';
  const r = b / a;
  if(Math.abs(r - 1) < 0.005) return 'Le parc reste stable';
  return r > 1 ? `Le parc croît de ${pct((r-1)*100, 0)}` : `Le parc recule de ${pct((1-r)*100, 0)}`;
}

/**
 * Bandeau en tête des facteurs. Sur T′ : sélecteur « Partir de » qui recharge T′ depuis une
 * référence (macros T_S1…T_S4). Sur T1–T4 (figées) : indice pour passer en T′ Libre.
 */
function trajEditBandeau(editable){
  if(editable){
    const refs = scenList.filter(s=>s.id!=='TP');
    const btns = refs.map(s=>`<button type="button" class="seed-btn${
      libreState.base===s.id && !libreState.edited ? ' active' : ''}" data-seed="${esc(s.id)}">${esc(s.nom)}</button>`).join('');
    return `<div class="libre-seed"><span class="libre-seed-lab">Trajectoire T′ — partir de :</span>${btns}</div>`;
  }
  return `<div class="ro-hint">Trajectoire de référence, en lecture seule.
    <button type="button" class="link-btn" data-goto-libre>Passer en T′ Libre</button> pour personnaliser les facteurs.</div>`;
}

/**
 * Tables des facteurs d'équipement, un accordéon par profil. Éditables uniquement sur T′
 * (comme le classeur) ; en lecture seule sur les trajectoires de référence T1–T4.
 */
function renderFacTables(){
  const host = document.getElementById('facTables');
  if(!host) return;
  const editable = scenEditable();
  const refs = scenList.filter(s=>s.id!=='TP');
  const blocs = profilList.filter(p=>p!=='Public').map((profil, idx)=>{
    const appareils = termData.appareils.filter(a=>a.profils.includes(profil));
    if(!appareils.length) return '';
    const head = `<tr><th>Équipement</th>${refs.map(s=>`<th>${esc(s.nom)}</th>`).join('')}<th>Valeur utilisée</th></tr>`;
    const body = appareils.map(a=>{
      const cellsRef = refs.map(s=>{
        const f = (termData.fac[s.id][profil]||{})[a.id];
        return `<td class="ro">${f==null?'—':fmtNum(f)}</td>`;
      }).join('');
      const cur = (scenNum.fac[profil]||{})[a.id];
      return `<tr><td>${esc(a.id)}</td>${cellsRef}<td><input type="number" min="0" step="0.05"
        data-fac-profil="${esc(profil)}" data-fac-appareil="${esc(a.id)}" value="${cur==null?1:round2(cur)}"
        ${editable?'':'disabled'} aria-label="Facteur d'équipement — ${esc(a.id)}, ${esc(profil)}"></td></tr>`;
    }).join('');
    return `<details class="param-acc" ${idx===0?'open':''}><summary>${esc(profil)}</summary>
      <div class="grid-scroll" style="margin:10px 0"><table class="mix mix-wide"><thead>${head}</thead><tbody>${body}</tbody></table></div></details>`;
  }).join('');
  host.innerHTML = trajEditBandeau(editable) + blocs;
  if(editable){
    host.querySelectorAll('input[data-fac-profil]').forEach(inp=>inp.oninput=()=>{
      const p = inp.dataset.facProfil, a = inp.dataset.facAppareil;
      (scenNum.fac[p] = scenNum.fac[p] || {})[a] = Math.max(0, +inp.value || 0);
      markScenarioLibre();
      recompute();
      refreshTrajOutputs();
      syncScenBar();
    });
    host.querySelectorAll('[data-seed]').forEach(b=>b.onclick=()=>{
      seedLibreFrom(b.dataset.seed);
      renderFacTables(); renderDvTable();
      syncScenBar(); render();
    });
  } else {
    const go = host.querySelector('[data-goto-libre]');
    if(go) go.onclick=()=>{ setScenario('TP'); recompute(); syncScenBar(); goToTrajEdit(); };
  }
}

/** Table de la durée de vie, par équipement. Éditable uniquement sur T′ (comme le classeur). */
function renderDvTable(){
  const host = document.getElementById('dvTable');
  if(!host) return;
  const editable = scenEditable();
  const head = `<tr><th>Équipement</th><th>Durée de vie en 2025</th><th>Facteur à 2050</th><th>Durée de vie en 2050</th></tr>`;
  const body = termData.appareils.map(a=>{
    const f = scenNum.facDV[a.id] != null ? scenNum.facDV[a.id] : 1;
    return `<tr><td>${esc(a.id)}</td><td class="ro">${fmtNum(a.dv)} ans</td>
      <td><input type="number" min="0.1" step="0.05" data-dv="${esc(a.id)}" value="${round2(f)}"
        ${editable?'':'disabled'} aria-label="Facteur de durée de vie — ${esc(a.id)}"></td>
      <td class="ro" data-dv2050="${esc(a.id)}">${fmtNum(a.dv*f)} ans</td></tr>`;
  }).join('');
  host.innerHTML = `<div class="grid-scroll" style="margin:10px 0"><table class="mix mix-wide"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
  if(!editable) return;
  host.querySelectorAll('input[data-dv]').forEach(inp=>inp.oninput=()=>{
    const id = inp.dataset.dv;
    scenNum.facDV[id] = Math.max(0.1, +inp.value || 1);
    const a = termData.appareils.find(x=>x.id===id);
    const out = host.querySelector(`[data-dv2050="${CSS.escape(id)}"]`);
    if(out && a) out.textContent = fmtNum(a.dv*scenNum.facDV[id])+' ans';
    markScenarioLibre();
    recompute();
    refreshTrajOutputs();
    syncScenBar();
  });
}

/**
 * Graphe du levier durée de vie : besoin annuel de matière neuve selon des durées de vie
 * plus ou moins longues, à équipement inchangé.
 */
function drawDvChart(){
  const base = tonnageBaseParAppareil()['Flux entrants'] || {};
  const refTerm = termRef;
  const series = DV_MULTIPLICATEURS.map(mult=>{
    const facDV = {};
    for(const a of termData.appareils) facDV[a.id] = (scenNum.facDV[a.id] != null ? scenNum.facDV[a.id] : 1) * mult;
    const variante = computeTerm(scenNum.fac, facDV);
    const data = YEARS.map((_,k)=>{
      let t = 0;
      for(const label in base){
        const ref = refTerm[label] && refTerm[label].entrants[k];
        const cur = variante[label] && variante[label].entrants[k];
        if(ref > 0 && cur != null) t += base[label][k] * (cur/ref);
        else if(!refTerm[label]) t += base[label][k];
      }
      return t;
    });
    return {mult, data};
  });
  const couleurs = ['#c0392b','#4e79a7','#59a14f','#2e7d32','#1b5e20'];
  if(dvChart) dvChart.destroy();
  dvChart = new Chart(document.getElementById('dvChart'), {
    type:'line',
    data:{labels:YEARS, datasets:series.map((s,i)=>({
      label: s.mult===1 ? 'Durée de vie actuelle' : `Durée de vie × ${s.mult.toLocaleString('fr-FR')}`,
      data:s.data, borderColor:couleurs[i], borderWidth:s.mult===1?3:2, borderDash:s.mult===1?[]:[5,3],
      fill:false, pointRadius:0, tension:.25}))},
    options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
      scales:{x:{ticks:{maxRotation:0, autoSkip:true}}, y:{ticks:{callback:v=>fmtTShort(v)}, beginAtZero:true}},
      plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${fmtT(c.parsed.y)}`}}}}
  });

  const cap = document.getElementById('dvCaption');
  if(cap){
    const ref = series.find(s=>s.mult===1), plus = series.find(s=>s.mult===1.5);
    const cumRef = ref.data.reduce((a,b)=>a+b,0), cumPlus = plus.data.reduce((a,b)=>a+b,0);
    const gain = cumRef>0 ? (1-cumPlus/cumRef)*100 : 0;
    cap.textContent = `Allonger la durée de vie de moitié économise ${fmtT(cumRef-cumPlus)} sur la période, `
      + `soit ${pct(gain,1)} de la matière neuve. Le nombre d'appareils détenus ne change pas.`;
  }
}

/** Rafraîchit les visuels dépendants d'un réglage, sans reconstruire les tables de saisie. */
function refreshTrajOutputs(){
  if(currentPage !== 'traj') return;
  drawTermChart();
  drawDvChart();
}
