"use strict";

// ---- Onglet « Électricité » ----
// Le classeur donne la consommation annuelle des trois postes du numérique. Les terminaux
// suivent le nombre d'appareils : leur consommation réagit donc à la trajectoire. Les
// réseaux et les centres de données suivent leur propre trajectoire dans le classeur.

const ELEC_COLORS = { 'Terminaux':'#4e79a7', 'Réseaux':'#59a14f', 'Datacenters':'#f28e2b' };

/** Rend la page Électricité : chiffres clés, répartition par poste et part nationale. */
function renderElec(){
  const parTheme = elecParTheme();
  renderElecKpis(parTheme);
  drawElecChart(parTheme);
  drawElecPartChart(parTheme);
}

/** Somme des trois postes, par année. */
function elecTotal(parTheme){
  return YEARS.map((_,k)=> Object.values(parTheme).reduce((s,serie)=>s+(serie[k]||0), 0));
}

/** Chiffres clés de la consommation électrique. */
function renderElecKpis(parTheme){
  const host = document.getElementById('elecKpis');
  if(!host) return;
  const total = elecTotal(parTheme);
  const kFin = YEARS.length - 1;
  const dominant = Object.keys(parTheme).sort((a,b)=>parTheme[b][kFin]-parTheme[a][kFin])[0] || '—';
  const pop = popFrance[kFin] || 68e6;
  const kpis = [
    [`Consommation en ${YEAR_MIN}`, fmtTWh(total[0]), `soit ${pct(total[0]/prodElecTerritoire()*100,1)} de la production ${territoireNom()==="Territoire national"?"nationale":"régionale"}`],
    [`Consommation en ${YEAR_MAX}`, fmtTWh(total[kFin]), `soit ${pct(total[kFin]/prodElecTerritoire()*100,1)} de la production ${territoireNom()==="Territoire national"?"nationale":"régionale"}`],
    ['Poste le plus consommateur en 2050', dominant, fmtTWh(parTheme[dominant] ? parTheme[dominant][kFin] : 0)],
    ['Consommation par habitant en 2050', (total[kFin]*1e6/pop).toLocaleString('fr-FR',{maximumFractionDigits:0})+' kWh',
      'par national et par an'],
  ];
  host.innerHTML = kpis.map(([lab,val,sub])=>
    `<div class="kpi"><div class="label">${esc(lab)}</div><div class="value">${esc(val)}</div><div class="sub">${esc(sub)}</div></div>`).join('');
}

/** Aires empilées de la consommation, par poste. */
function drawElecChart(parTheme){
  const ordre = ['Terminaux','Réseaux','Datacenters'].filter(t=>parTheme[t]);
  const datasets = ordre.map(t=>({ label:t, data:parTheme[t],
    backgroundColor:(ELEC_COLORS[t]||'#888')+'cc', borderColor:ELEC_COLORS[t]||'#888',
    borderWidth:1, fill:true, pointRadius:0, tension:.25 }));
  if(elecChart) elecChart.destroy();
  elecChart = new Chart(document.getElementById('elecChart'), {
    type:'line', data:{labels:YEARS, datasets},
    options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false},
      scales:{x:{stacked:true, ticks:{maxRotation:0, autoSkip:true}},
        y:{stacked:true, beginAtZero:true, ticks:{callback:v=>fmtTWh(v)}}},
      plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}},
        tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${fmtTWh(c.parsed.y)}`}}}}
  });
  fillSrTable('elecTable', ['Poste', ...YEARS.map(String)],
    ordre.map(t=>[t, ...parTheme[t].map(v=>fmtTWh(v))]));
}

/** Part de la consommation du numérique dans la production électrique nationale. */
function drawElecPartChart(parTheme){
  const total = elecTotal(parTheme);
  const part = total.map(v=>v/prodElecTerritoire()*100);
  if(elecPartChart) elecPartChart.destroy();
  elecPartChart = new Chart(document.getElementById('elecPartChart'), {
    type:'line',
    data:{labels:YEARS, datasets:[{label:'Part de la production nationale', data:part, fill:true,
      backgroundColor:'rgba(78,121,167,.22)', borderColor:'#4e79a7', borderWidth:2, pointRadius:2, tension:.25}]},
    options:{responsive:true, maintainAspectRatio:false,
      scales:{x:{ticks:{maxRotation:0, autoSkip:true}}, y:{beginAtZero:true, ticks:{callback:v=>pct(v,1)}}},
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>pct(c.parsed.y,2)+' de la production nationale'}}}}
  });
}
