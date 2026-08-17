"use strict";

const DATA_INTRO = {
  stock:    "Ce tableau de bord pèse la matière contenue dans les équipements en service. Il répond à la question : que contient le parc numérique national ?",
  entrants: "Ce tableau de bord pèse la matière neuve qui entre chaque année dans le parc. Il répond à la question : que faut-il extraire pour équiper le territoire ?",
  sortants: "Ce tableau de bord pèse la matière qui quitte le parc chaque année. Il répond à la question : que deviennent les appareils remplacés ?",
};

/**
 * Rendu de la page courante : aiguille vers Synthèse / Trajectoires / Électricité /
 * Soutenabilité, sinon rend les 4 visuels des pages « type de données ».
 * @param {string} [activeDim] dimension de filtre que l'utilisateur vient de modifier
 */
function render(activeDim){
  if(!records.length) return;

  const full = isFullPage();
  document.getElementById('app').classList.toggle('full', full);
  document.getElementById('filters').style.display = full ? 'none' : '';
  document.getElementById('kpis').style.display = (full || currentPage==='sout') ? 'none' : 'grid';

  if(currentPage==='synthese'){ renderSynthese(); return; }
  if(currentPage==='traj'){ renderTraj(); return; }
  if(currentPage==='elec'){ renderElec(); return; }

  // le filtre matière n'a pas de sens en soutenabilité : une seule matière y est analysée
  document.getElementById('slicerMatiere').style.display = currentPage==='sout' ? 'none' : '';
  renderFilters(activeDim);

  if(currentPage==='sout'){ renderSout(); return; }

  // pages type de données (Stock / Flux Entrants / Flux Sortants) : 4 visuels
  document.getElementById('dataTitle').textContent = PAGE_TITLE[currentPage] || '';
  const intro = document.getElementById('dataIntro');
  if(intro) intro.textContent = DATA_INTRO[currentPage] || '';
  const data = filtered();
  const byMat = new Map(); let total = 0;
  for(const r of data){ byMat.set(r.matiere,(byMat.get(r.matiere)||0)+r.valeur); total+=r.valeur; }
  const matsWithData = [...byMat.entries()].filter(([,v])=>v>0)
    .sort(matSort==='asc' ? (a,b)=>a[1]-b[1] : (a,b)=>b[1]-a[1]);
  document.getElementById('kpiCount').textContent = matsWithData.length;
  document.getElementById('kpiTotal').textContent = fmtT(total);
  const mats = matsWithData.map(([m])=>m);
  lastMats = mats;                           // ordre partagé avec les modes matière (stackh/col)

  drawDonut(matsWithData); drawLine(data, mats); drawLineSmall(data, matsWithData, total);
  lastTechData = data;                       // le graphe « équipement » ne se dessine qu'au clic d'un bouton
  if(techChartKind) drawTechChart(data);     // rafraîchit seulement si un type a déjà été choisi
}

/**
 * Réajuste les graphes de l'onglet affiché. Un graphe dessiné pendant que son onglet était
 * masqué garde la largeur qu'il avait alors : Chart.js ne détecte pas le redimensionnement
 * d'un conteneur invisible. Sans ce rappel, revenir sur l'onglet après un changement de
 * taille d'écran laisse un canvas trop large, et la page déborde horizontalement.
 */
function resizeVisibleCharts(){
  document.querySelectorAll('.page.active canvas').forEach(cv=>{
    const c = Chart.getChart(cv);
    if(c) c.resize();
  });
}

/**
 * Séries annuelles par matière sur la période sélectionnée.
 * @param {Array<Object>} data records filtrés
 * @param {string[]} mats matières à inclure
 * @returns {{years: number[], map: Object}} map[matière][année] = somme
 */
function seriesByYear(data, mats){
  const years=[]; for(let y=sel.yStart;y<=sel.yEnd;y++) years.push(y);
  const map={}; mats.forEach(m=>map[m]=Object.fromEntries(years.map(y=>[y,0])));
  for(const r of data){ if(map[r.matiere] && r.annee in map[r.matiere]) map[r.matiere][r.annee]+=r.valeur; }
  return {years, map};
}

/**
 * Donut « Masse totale par matière » (+ table accessible).
 * @param {Array<[string, number]>} entries paires [matière, total] triées
 */
function drawDonut(entries){
  const labels=entries.map(([m])=>m), values=entries.map(([,v])=>v), colors=labels.map(m=>colorMap[m]);
  if(donutChart){
    donutChart.data.labels = labels;
    donutChart.data.datasets[0].data = values;
    donutChart.data.datasets[0].backgroundColor = colors;
    donutChart.update();
  } else {
    donutChart = new Chart(document.getElementById('donut'), {
      type:'doughnut',
      data:{labels, datasets:[{data:values, backgroundColor:colors, borderWidth:1, borderColor:'#fff'}]},
      options:{responsive:true, maintainAspectRatio:false, cutout:'55%', layout:{padding:{top:4,right:6}},
        plugins:{ legend:{position:'right', labels:{boxWidth:10, padding:6, font:{size:10}}},
          tooltip:{callbacks:{label:c=>{ const t=c.dataset.data.reduce((a,b)=>a+b,0)||1;
            return `${c.label} : ${fmtT(c.parsed)} (${(c.parsed/t*100).toFixed(1)}%)`; }}} }}
    });
  }
  fillSrTable('donutTable', ['Matière','Valeur'], entries.map(([m,v])=>[m, fmtT(v)]));
}
/**
 * Aires empilées « Masse par année et par matière » (+ table accessible).
 * @param {Array<Object>} data records filtrés
 * @param {string[]} mats matières (ordre des séries)
 */
function drawLine(data, mats){
  const {years,map}=seriesByYear(data,mats);
  const datasets=mats.map(m=>({label:m, data:years.map(y=>map[m][y]),
    backgroundColor:colorMap[m]+'cc', borderColor:colorMap[m], borderWidth:1, fill:true, pointRadius:0, tension:.25}));
  if(lineChart){
    lineChart.data.labels = years;
    lineChart.data.datasets = datasets;
    lineChart.update();
  } else {
    lineChart = new Chart(document.getElementById('line'), {
      type:'line', data:{labels:years, datasets},
      options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false}, layout:{padding:{top:4}},
        scales:{x:{stacked:true, ticks:{maxRotation:0, autoSkip:true}}, y:{stacked:true, ticks:{callback:v=>fmtT(v)}}},
        plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}}, tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${fmtT(c.parsed.y)}`}}}}
    });
  }
  fillSrTable('lineTable', ['Matière',...years.map(String)], mats.map(m=>[m, ...years.map(y=>fmtT(map[m][y]))]));
}
/**
 * Graphe dédié aux matières à faible masse : n'affiche que celles dont le total est dans la
 * plage de tonnage choisie, pour qu'elles ne soient plus écrasées par le fer et l'aluminium.
 * @param {Array<Object>} data records filtrés
 * @param {Array<[string, number]>} matsWithData paires [matière, total] triées
 * @param {number} total somme générale (gardé pour la signature commune)
 */
function drawLineSmall(data, matsWithData, total){
  const inRange = ([,v]) => v>=sel.smallMatMin && v<=sel.smallMatMax;
  const big = matsWithData.filter(e=>!inRange(e)).map(([m])=>m);
  const small = matsWithData.filter(inRange).map(([m])=>m);
  const caption = document.getElementById('lineSmallCaption');
  if(caption) caption.textContent = big.length
    ? `Le graphe exclut ${big.join(', ')} : ces matières sortent de la plage ${sel.smallMatMin.toLocaleString('fr-FR')}–${sel.smallMatMax.toLocaleString('fr-FR')} t. Le graphe principal les affiche.`
    : '';
  const {years,map}=seriesByYear(data,small);
  // pas de remplissage (fill:false) : une aire remplie reste opaque et occupe tout l'espace entre 0
  // et sa valeur, donc la matière dominante « masque » les autres quel que soit l'ordre de dessin —
  // en simples courbes, toutes les matières restent visibles simultanément, y compris la plus grande
  const datasets=small.map(m=>({label:m, data:years.map(y=>map[m][y]),
    borderColor:colorMap[m], borderWidth:2, fill:false, pointRadius:0, tension:.25}));
  if(lineSmallChart){
    lineSmallChart.data.labels = years;
    lineSmallChart.data.datasets = datasets;
    lineSmallChart.update();
  } else {
    lineSmallChart = new Chart(document.getElementById('lineSmall'), {
      type:'line', data:{labels:years, datasets},
      options:{responsive:true, maintainAspectRatio:false, interaction:{mode:'index', intersect:false}, layout:{padding:{top:4}},
        scales:{x:{ticks:{maxRotation:0, autoSkip:true}}, y:{ticks:{callback:v=>fmtT(v)}}},
        plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}}, tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${fmtT(c.parsed.y)}`}}}}
    });
  }
  fillSrTable('lineSmallTable', ['Matière',...years.map(String)], small.map(m=>[m, ...years.map(y=>fmtT(map[m][y]))]));
}
/**
 * Dispatcher « Répartition par matière et par équipement » : dessine le graphe selon le type
 * choisi (techChartKind : treemap / rank / log / donut / stackh / col).
 * @param {Array<Object>} data records filtrés
 */
function drawTechChart(data){
  lastTechData = data;
  if(treeChart){ treeChart.destroy(); treeChart=null; }
  const cv = document.getElementById('tree');
  const crumb = document.getElementById('treeCrumb'), smallList = document.getElementById('treeSmall');
  if(crumb) crumb.innerHTML = '';
  if(smallList) smallList.innerHTML = '';
  if(techChartKind==='treemap') return drawTreemap(data);
  // agrégations par équipement (somme sur matières) + par matière×équipement
  const byTech={}, aggMT={};
  for(const r of data){ if(r.valeur<=0) continue;
    byTech[r.techno]=(byTech[r.techno]||0)+r.valeur;
    (aggMT[r.matiere]=aggMT[r.matiere]||{})[r.techno]=(aggMT[r.matiere][r.techno]||0)+r.valeur; }
  const techs=Object.keys(byTech).sort((a,b)=>byTech[b]-byTech[a]);
  const tc=Object.fromEntries(techs.map((t,i)=>[t,PALETTE[i%PALETTE.length]]));
  const common={responsive:true, maintainAspectRatio:false};
  if(techChartKind==='rank'){          // barres horizontales classées (dominance + petites en fin)
    treeChart=new Chart(cv,{type:'bar', data:{labels:techs, datasets:[{data:techs.map(t=>byTech[t]), backgroundColor:techs.map(t=>tc[t])}]},
      options:{...common, indexAxis:'y', plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmtT(c.parsed.x)}}},
        scales:{x:{ticks:{callback:v=>fmtT(v)}}, y:{ticks:{font:{size:10}}}}}});
  } else if(techChartKind==='log'){     // échelle logarithmique : petits équipements visibles
    treeChart=new Chart(cv,{type:'bar', data:{labels:techs, datasets:[{data:techs.map(t=>byTech[t]), backgroundColor:techs.map(t=>tc[t])}]},
      plugins:[barValuePlugin],
      options:{...common, layout:{padding:{top:18}},
        plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>fmtT(c.parsed.y)}}},
        scales:{x:{ticks:{maxRotation:60, minRotation:45, font:{size:9}}},
          y:{type:'logarithmic',
             // libellés compacts uniquement sur les puissances de 10 (1 M t, 10 M t…) pour déclutter ;
             // on ne filtre pas le tableau de ticks (cela casserait le calcul de layout des barres)
             ticks:{callback:v=>{ const l=Math.log10(v); return Math.abs(l-Math.round(l))<1e-6 ? fmtTShort(v) : ''; }}}}}});
  } else if(techChartKind==='donut'){   // proportions par équipement
    treeChart=new Chart(cv,{type:'doughnut', data:{labels:techs, datasets:[{data:techs.map(t=>byTech[t]), backgroundColor:techs.map(t=>tc[t])}]},
      options:{...common, layout:{padding:{top:4,right:6}}, plugins:{legend:{position:'right', labels:{boxWidth:10, padding:6, font:{size:10}}}, tooltip:{callbacks:{label:c=>`${c.label} : ${fmtT(c.parsed)}`}}}}});
  } else if(techChartKind==='stackh'){  // barres empilées 100 % : composition par équipement
    const mats=lastMats.filter(m=>aggMT[m]);   // ordre matières = tri global (valeur décroissante / croissante)
    const totMat=Object.fromEntries(mats.map(m=>[m, Object.values(aggMT[m]).reduce((s,v)=>s+v,0)]));
    const datasets=techs.map(t=>({label:t, data:mats.map(m=> totMat[m]>0 ? (aggMT[m][t]||0)/totMat[m]*100 : 0), backgroundColor:tc[t]}));
    treeChart=new Chart(cv,{type:'bar', data:{labels:mats, datasets},
      options:{...common, indexAxis:'y', interaction:{mode:'index', intersect:false, axis:'y'},
        plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=> c.parsed.x
          ? `${c.dataset.label} : ${pct(c.parsed.x,1)} (${fmtTShort(aggMT[mats[c.dataIndex]][c.dataset.label]||0)})` : null}}},
        scales:{x:{stacked:true, min:0, max:100, ticks:{callback:v=>pct(v,0)}}, y:{stacked:true, ticks:{font:{size:9}}}}}});
  } else if(techChartKind==='col'){     // histogramme empilé année × matière (tonnes)
    const mats=lastMats.filter(m=>aggMT[m]);   // ordre matières = tri global
    const {years,map}=seriesByYear(data,mats);
    const datasets=mats.map(m=>({label:m, data:years.map(y=>map[m][y]), backgroundColor:colorMap[m]}));
    treeChart=new Chart(cv,{type:'bar', data:{labels:years, datasets},
      options:{...common, interaction:{mode:'index', intersect:false},
        scales:{x:{stacked:true, ticks:{maxRotation:0, autoSkip:true}}, y:{stacked:true, ticks:{callback:v=>fmtT(v)}}},
        plugins:{legend:{position:'bottom', labels:{boxWidth:10, padding:6, font:{size:10}}},
          tooltip:{callbacks:{label:c=>`${c.dataset.label} : ${fmtT(c.parsed.y)}`}}}}});
  }
}

/** Part sous laquelle une tuile est trop petite pour porter un texte lisible. */
const TREE_SEUIL_PETIT = 0.012;

/**
 * Treemap matière → équipement (surface = tonnes cumulées sur la période).
 * Un clic sur une matière zoome sur ses équipements : c'est ce qui rend lisibles les
 * catégories trop petites pour afficher leur nom dans la vue d'ensemble. Les tuiles qui
 * restent trop petites sont listées sous le graphe.
 * @param {Array<Object>} data records filtrés
 */
function drawTreemap(data){
  // le zoom et le fil d'Ariane rappellent cette fonction sur le même canvas :
  // sans destruction préalable, Chart.js refuse de réutiliser le canvas
  if(treeChart){ treeChart.destroy(); treeChart=null; }
  const agg={}; // matiere -> techno -> somme
  for(const r of data){ if(r.valeur<=0) continue; (agg[r.matiere]=agg[r.matiere]||{}); agg[r.matiere][r.techno]=(agg[r.matiere][r.techno]||0)+r.valeur; }
  if(treeFocus && !agg[treeFocus]) treeFocus = null;   // la matière a disparu des filtres

  const tree=[];
  if(treeFocus){
    for(const t in agg[treeFocus]) tree.push({matiere:treeFocus, techno:t, value:agg[treeFocus][t]});
  } else {
    for(const m in agg) for(const t in agg[m]) tree.push({matiere:m, techno:t, value:agg[m][t]});
  }
  const total = tree.reduce((s,e)=>s+e.value, 0) || 1;

  renderTreeCrumb(Object.keys(agg).sort((a,b)=>
    Object.values(agg[b]).reduce((s,v)=>s+v,0) - Object.values(agg[a]).reduce((s,v)=>s+v,0)));

  treeChart = new Chart(document.getElementById('tree'), {
    type:'treemap',
    data:{datasets:[{
      tree, key:'value',
      groups: treeFocus ? ['techno'] : ['matiere','techno'],
      spacing:0.5, borderWidth:1, borderColor:'#fff',
      backgroundColor(ctx){ if(ctx.type!=='data') return 'transparent';
        const o=ctx.raw && ctx.raw._data ? ctx.raw._data : {};
        const m = treeFocus || o.matiere || (ctx.raw && ctx.raw.g);
        const base=colorMap[m]||'#888'; return (ctx.raw && ctx.raw.l===0 && !treeFocus) ? base+'55' : base; },
      // overflow 'fit' réduit la police jusqu'à ce que le texte tienne dans la tuile,
      // au lieu de le masquer : les petites catégories gardent leur nom.
      captions:{display:true, color:'#fff', font:{weight:'bold', size:12}, overflow:'fit',
        formatter:c=>c.raw && c.raw.g ? c.raw.g : ''},
      labels:{display:true, color:'#fff', overflow:'fit', position:'middle',
        font:[{size:11},{size:9},{size:8}],
        formatter(ctx){ const o=ctx.raw&&ctx.raw._data?ctx.raw._data:{};
          if(!o.techno) return '';
          return ctx.raw.v/total > TREE_SEUIL_PETIT ? [o.techno, fmtT(ctx.raw.v)] : [o.techno]; }}
    }]},
    options:{responsive:true, maintainAspectRatio:false,
      onClick(evt, els){
        if(treeFocus || !els.length) return;
        const raw = els[0].element.$context.raw;
        const m = (raw._data && raw._data.matiere) || raw.g;
        if(m && agg[m]){ treeFocus = m; drawTreemap(lastTechData); }
      },
      plugins:{legend:{display:false}, tooltip:{callbacks:{
        title:items=>{const o=items[0].raw._data||{};return o.matiere?o.matiere+(o.techno?' · '+o.techno:''):(items[0].raw.g||'');},
        label:item=>`${fmtT(item.raw.v)} — ${pct(item.raw.v/total*100,1)} de la vue`}}}}
  });

  renderTreeSmall(tree, total);
}

/**
 * Fil d'Ariane du treemap : niveau courant et retour à la vue d'ensemble.
 * @param {string[]} matieres matières présentes, triées par masse décroissante
 */
function renderTreeCrumb(matieres){
  const host = document.getElementById('treeCrumb');
  if(!host) return;
  if(!treeFocus){
    host.innerHTML = `<span class="crumb-hint">Clique sur une matière pour zoomer sur ses équipements.</span>`;
    return;
  }
  const sel = matieres.map(m=>`<option value="${esc(m)}" ${m===treeFocus?'selected':''}>${esc(m)}</option>`).join('');
  host.innerHTML = `<button type="button" class="crumb-btn" id="crumbBack">← Toutes les matières</button>`
    + `<span class="crumb-sep">›</span>`
    + `<label class="sr-only" for="crumbSel">Matière affichée</label>`
    + `<select id="crumbSel" class="crumb-sel">${sel}</select>`;
  host.querySelector('#crumbBack').onclick = ()=>{ treeFocus=null; drawTreemap(lastTechData); };
  host.querySelector('#crumbSel').onchange = e=>{ treeFocus=e.target.value; drawTreemap(lastTechData); };
}

/**
 * Liste des tuiles trop petites pour porter leur nom sur le graphe : aucune catégorie
 * ne reste invisible.
 * @param {Array<Object>} tree entrées du treemap
 * @param {number} total somme des valeurs affichées
 */
function renderTreeSmall(tree, total){
  const host = document.getElementById('treeSmall');
  if(!host) return;
  const petites = tree.filter(e=>e.value/total <= TREE_SEUIL_PETIT)
    .sort((a,b)=>b.value-a.value);
  if(!petites.length){ host.innerHTML=''; return; }
  const items = petites.slice(0, 24).map(e=>
    `<span class="tree-chip"><i style="background:${colorMap[e.matiere]||'#888'}"></i>`
    + `${esc(treeFocus ? e.techno : e.matiere+' · '+e.techno)} <b>${esc(fmtTShort(e.value))}</b></span>`).join('');
  const reste = petites.length > 24 ? `<span class="tree-chip more">et ${petites.length-24} autres</span>` : '';
  host.innerHTML = `<p class="det">Ces catégories pèsent moins de ${pct(TREE_SEUIL_PETIT*100,1)} du total. `
    + `Le graphe les affiche en tuiles trop fines pour être lues :</p><div class="tree-chips">${items}${reste}</div>`;
}
