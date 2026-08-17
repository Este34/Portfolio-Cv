"use strict";

// ---- Soutenabilité : besoin national rapporté à la production mondiale ----
// Le besoin est le flux entrant de matière : c'est la matière neuve qu'il faut extraire
// chaque année. La production mondiale vient de la feuille « Matrice TCD » du classeur.

/**
 * Rend la page Soutenabilité pour la matière sélectionnée : jauge, détail par équipement
 * et courbe annuelle.
 */
function renderSout(){
  if(!dims.soutMatieres.length){
    document.getElementById('soutMatrix').innerHTML =
      '<div class="empty">La production mondiale des matières est absente du jeu de données.</div>';
    return;
  }
  const m = sel.soutMatiere, prod = prodMap[m];
  const a=sel.yStart, b=sel.yEnd, ny=b-a+1, t=TYPES.entrants;
  const years=[]; for(let y=a;y<=b;y++) years.push(y);
  const perYear=Object.fromEntries(years.map(y=>[y,0]));
  const cell={};   // thème -> équipement -> somme sur la période
  for(const r of records){
    if(r.type!==t || r.matiere!==m) continue;
    if(sel.energies.size && !sel.energies.has(r.energie)) continue;
    if(sel.technos.size  && !sel.technos.has(r.techno))   continue;
    if(r.annee<a || r.annee>b) continue;
    perYear[r.annee]+=r.valeur;
    (cell[r.energie] = cell[r.energie]||{});
    cell[r.energie][r.techno]=(cell[r.energie][r.techno]||0)+r.valeur;
  }
  const toPct = sumPeriod => prod>0 ? (sumPeriod/ny)/prod*100 : 0;
  const totalSum = years.reduce((s,y)=>s+perYear[y],0);

  drawGauge(toPct(totalSum));
  drawSoutMatrix(cell, toPct, m);
  drawSoutLine(years, perYear, prod);
  drawSoutHeatmap(years);
  syncSeuilLabels();
}

/** Cellule colorée réutilisée par la matrice thème×équipement et par la heatmap matières×années. */
function pctCellHtml(p){
  return `<td><span class="pctcell" style="background:${bandColor(p)};color:${p<SEUILS[1]?'#222':'#fff'};padding:1px 6px">${pct(p,3)}</span></td>`;
}

/**
 * Calcule la tension d'approvisionnement (besoin / production mondiale, %) par matière et par
 * année, pour toutes les matières ayant une production mondiale connue.
 * @param {number[]} years années de la période filtrée
 * @returns {{matieres:string[], years:number[], valeurs:Object}} valeurs[matière][année] = %
 */
function soutHeatmapData(years){
  const t = TYPES.entrants;
  const valeurs = {};
  for(const m of dims.soutMatieres) valeurs[m] = Object.fromEntries(years.map(y=>[y,0]));
  for(const r of records){
    if(r.type!==t || !valeurs[r.matiere]) continue;
    if(sel.energies.size && !sel.energies.has(r.energie)) continue;
    if(sel.technos.size  && !sel.technos.has(r.techno))   continue;
    if(r.annee<years[0] || r.annee>years[years.length-1]) continue;
    valeurs[r.matiere][r.annee] += r.valeur;
  }
  for(const m of dims.soutMatieres){
    const prod = prodMap[m];
    for(const y of years) valeurs[m][y] = prod>0 ? valeurs[m][y]/prod*100 : 0;
  }
  return {matieres:dims.soutMatieres, years, valeurs};
}

/** Heatmap matières × années : tension d'approvisionnement de chaque matière, année par année. */
function drawSoutHeatmap(years){
  const host = document.getElementById('soutHeatmap');
  if(!host) return;
  const {matieres, valeurs} = soutHeatmapData(years);
  if(!matieres.length){
    host.innerHTML = '<div class="empty">La production mondiale des matières est absente du jeu de données.</div>';
    return;
  }
  const head = `<thead><tr><th>Matière</th>${years.map(y=>`<th>${y}</th>`).join('')}</tr></thead>`;
  const rows = matieres.map(m=>{
    const cls = m===sel.soutMatiere ? ' class="sout-heat-sel"' : '';
    return `<tr${cls}><td>${esc(m)}</td>${years.map(y=>pctCellHtml(valeurs[m][y])).join('')}</tr>`;
  }).join('');
  host.innerHTML = `<table class="matrix">${head}<tbody>${rows}</tbody></table>`;
}

/** Aligne les repères affichés dans la légende sur les seuils lus dans le classeur. */
function syncSeuilLabels(){
  document.querySelectorAll('[data-seuil]').forEach(el=>{
    const i = el.dataset.seuil === '2b' ? 2 : +el.dataset.seuil;
    el.textContent = SEUILS[i].toLocaleString('fr-FR',{minimumFractionDigits:3, maximumFractionDigits:3});
  });
}

/**
 * Demi-jauge de soutenabilité : bandes colorées jusqu'à la valeur, gris au-delà, aiguille
 * dessinée par le plugin gaugeNeedle.
 * @param {number} value pourcentage (besoin / production mondiale)
 */
function drawGauge(value){
  const max = gaugeMax(value);
  const v = Math.max(0, Math.min(value, max));
  const bounds = [0, SEUILS[0], SEUILS[1], SEUILS[2], max];
  const widths=[], cols=[];
  for(let i=0;i<4;i++){
    const lo=bounds[i], hi=Math.min(bounds[i+1], v);
    if(hi>lo){ widths.push(hi-lo); cols.push(BAND_COLORS[i]); }
  }
  if(v<max){ widths.push(max-v); cols.push('#e3e3e3'); }   // gris au-delà
  // synchronise le meter accessible (#gaugeMeter) : les lecteurs d'écran reçoivent la valeur
  const meter = document.getElementById('gaugeMeter');
  if(meter){
    meter.setAttribute('aria-valuemax', max);
    meter.setAttribute('aria-valuenow', round2(v));
    meter.setAttribute('aria-valuetext', pct(value,3)+' — '+niveauLabel(value));
    const txt = document.getElementById('gaugeMeterText');
    if(txt) txt.textContent = pct(value,3)+' — '+niveauLabel(value);
  }
  if(gaugeChart) gaugeChart.destroy();
  gaugeChart = new Chart(document.getElementById('gauge'), {
    type:'doughnut',
    data:{datasets:[{data:widths, backgroundColor:cols, borderWidth:0}]},
    options:{responsive:true, maintainAspectRatio:false, rotation:-90, circumference:180, cutout:'72%',
      plugins:{legend:{display:false}, tooltip:{enabled:false}, gaugeNeedle:{value, max}}},
    plugins:[gaugeNeedlePlugin]
  });
}
const gaugeNeedlePlugin = {
  id:'gaugeNeedle',
  afterDatasetDraw(chart, args, opts){
    const max = opts.max || 3;
    const v = Math.max(0, Math.min(opts.value, max));
    const meta = chart.getDatasetMeta(0); if(!meta.data.length) return;
    const arc = meta.data[0]; const cx=arc.x, cy=arc.y, r=arc.outerRadius;
    const ang = Math.PI + (v/max)*Math.PI;          // π (gauche) -> 2π (droite)
    const ctx = chart.ctx;
    ctx.save();
    // aiguille
    ctx.strokeStyle='#2b2f5e'; ctx.lineWidth=3; ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(cx + r*0.9*Math.cos(ang), cy + r*0.9*Math.sin(ang)); ctx.stroke();
    ctx.fillStyle='#2b2f5e'; ctx.beginPath(); ctx.arc(cx,cy,5,0,2*Math.PI); ctx.fill();
    // texte central
    ctx.textAlign='center';
    ctx.fillStyle=bandColor(opts.value); ctx.font='bold 26px Segoe UI,Arial';
    ctx.fillText(pct(opts.value,3), cx, cy - r*0.18);
    ctx.fillStyle='#555'; ctx.font='12px Segoe UI,Arial';
    ctx.fillText(niveauLabel(opts.value), cx, cy - r*0.02);
    // bornes
    ctx.fillStyle='#888'; ctx.font='11px Segoe UI,Arial';
    ctx.textAlign='left';  ctx.fillText('0 %', cx - r, cy + 14);
    ctx.textAlign='right'; ctx.fillText(max+' %', cx + r, cy + 14);
    ctx.restore();
  }
};

/**
 * Détail thème × équipement des parts de production mondiale, cellules colorées par niveau.
 * @param {Object} cell cell[thème][équipement] = somme sur la période
 * @param {function(number): number} toPct convertit une somme en % (besoin moyen / prod mondiale)
 * @param {string} m matière affichée (en-tête)
 */
function drawSoutMatrix(cell, toPct, m){
  let rows=''; let grand=0;
  for(const e of dims.energies){
    if((sel.energies.size && !sel.energies.has(e)) || !cell[e]) continue;   // ensemble vide = aucune contrainte (comme filtered())
    const technos=Object.keys(cell[e]).filter(t=>cell[e][t]>0).sort();
    if(!technos.length) continue;
    const eSum=technos.reduce((s,t)=>s+cell[e][t],0); grand+=eSum;
    rows += `<tr class="energie"><td>${esc(e)}</td>${pctCellHtml(toPct(eSum))}</tr>`;
    for(const t of technos) rows += `<tr class="techno"><td>${esc(t)}</td>${pctCellHtml(toPct(cell[e][t]))}</tr>`;
  }
  const head = `<thead><tr><th>Thème / Équipement</th><th>${esc(m)}</th></tr></thead>`;
  const totalRow = `<tr class="total"><td>Total</td>${pctCellHtml(toPct(grand))}</tr>`;
  document.getElementById('soutMatrix').innerHTML = rows
    ? `<table class="matrix">${head}<tbody>${rows}${totalRow}</tbody></table>`
    : `<div class="empty">Aucune donnée ne correspond à cette sélection.</div>`;
}

/**
 * Courbe annuelle « besoin / production mondiale » (%).
 * @param {number[]} years années de la période
 * @param {Object} perYear {année: somme des flux entrants}
 * @param {number} prod production mondiale de la matière (tonnes)
 */
function drawSoutLine(years, perYear, prod){
  const data = years.map(y=> prod>0 ? perYear[y]/prod*100 : 0);
  if(soutLineChart) soutLineChart.destroy();
  soutLineChart = new Chart(document.getElementById('soutLine'), {
    type:'line',
    data:{labels:years, datasets:[{label:'Besoin / production mondiale', data, fill:true,
      backgroundColor:'rgba(64,120,200,.25)', borderColor:'#4078c8', borderWidth:2, pointRadius:2, tension:.25}]},
    options:{responsive:true, maintainAspectRatio:false,
      scales:{x:{ticks:{maxRotation:0, autoSkip:true}}, y:{ticks:{callback:v=>pct(v,3)}, beginAtZero:true}},
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>pct(c.parsed.y,3)}}}}
  });
  fillSrTable('soutLineTable', ['Année','Part de la production mondiale'],
    years.map((y,i)=>[y, pct(data[i],3)]));
}
