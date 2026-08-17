"use strict";

// ---- UI ----
/**
 * Câble l'UI statique : sélecteur soutenabilité, boutons de graphe/tri, onglets (clavier inclus),
 * bascules TWh/GW·%, et curseurs noUiSlider (période + plage de tonnage).
 */
function buildUI(){
  const sm = document.getElementById('soutMatSel');
  sm.innerHTML = dims.soutMatieres.map(m=>`<option ${m===sel.soutMatiere?'selected':''}>${esc(m)}</option>`).join('');
  sm.onchange = ()=>{ sel.soutMatiere = sm.value; render(); };

  // boutons du type de graphe « Répartition matière/techno » : rien au départ, dessin animé au clic
  document.querySelectorAll('.chart-btn[data-kind]').forEach(b=>b.onclick=()=>{
    techChartKind = b.dataset.kind;
    document.querySelectorAll('.chart-btn[data-kind]').forEach(x=>x.classList.toggle('active', x===b));
    const hint=document.getElementById('techChartHint'); if(hint) hint.style.display='none';
    const wrap=document.getElementById('techWrap');
    if(wrap){ wrap.classList.remove('reveal'); void wrap.offsetWidth; wrap.classList.add('reveal'); }  // relance l'anim CSS
    drawTechChart(lastTechData);
  });
  // bouton de tri : bascule l'ordre des matières par valeur (décroissant ↔ croissant), global
  const msb = document.getElementById('matSortBtn');
  if(msb){
    const syncSortBtn = ()=>{
      msb.textContent = matSort==='asc' ? '↑' : '↓';
      msb.title = matSort==='asc'
        ? 'Matières triées par valeur croissante — cliquer pour décroissant'
        : 'Matières triées par valeur décroissante — cliquer pour croissant';
      msb.classList.toggle('active', matSort==='asc');
    };
    msb.onclick = ()=>{ matSort = matSort==='value' ? 'asc' : 'value'; syncSortBtn(); render(); };
    syncSortBtn();
  }

  const rf = document.getElementById('resetFilters');
  if(rf) rf.onclick = resetFilters;

  // grandeur comparée sur la page Synthèse
  document.querySelectorAll('[data-comp]').forEach(b=>b.onclick=()=>{
    compMode = b.dataset.comp;
    drawCompChart();
  });

  buildScenBar();

  const tabs = [...document.querySelectorAll('#tabs .tab')];
  const activateTab = (btn, focus)=>{
    currentPage = btn.dataset.page;
    tabs.forEach(b=>{
      const on = b===btn;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on?'true':'false');
      b.tabIndex = on ? 0 : -1;
    });
    const sid = sectionId();
    document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active', p.id===sid));
    // la page « page-data » est partagée par 3 onglets : on synchronise son libellé
    if(sid==='page-data') document.getElementById('page-data').setAttribute('aria-labelledby', btn.id);
    document.title = btn.textContent + " — Simulateur numérique Simulateur numérique";
    if(focus) btn.focus();
    render();
    requestAnimationFrame(()=>{
      resizeVisibleCharts();                       // l'onglet vient d'être révélé : largeurs à jour
      // le contenu de la nouvelle feuille change la hauteur : on recale la barre de
      // trajectoire pour qu'elle reste fixée en haut sans saut entre onglets
      if(window.recalerBarreTrajectoire) window.recalerBarreTrajectoire();
    });
  };
  tabs.forEach(btn=>{
    btn.onclick = ()=>activateTab(btn);
    btn.onkeydown = e=>{
      let i = tabs.indexOf(btn), j = null;
      if(e.key==='ArrowRight') j = (i+1)%tabs.length;
      else if(e.key==='ArrowLeft') j = (i-1+tabs.length)%tabs.length;
      else if(e.key==='Home') j = 0;
      else if(e.key==='End') j = tabs.length-1;
      if(j!==null){ e.preventDefault(); activateTab(tabs[j], true); }
    };
  });

  const slider = document.getElementById('yearSlider');
  if(slider.noUiSlider) slider.noUiSlider.destroy();
  noUiSlider.create(slider, {
    start:[YEAR_MIN, YEAR_MAX], connect:true, step:1, margin:0,
    range:{min:YEAR_MIN, max:YEAR_MAX}, format:{to:v=>Math.round(v), from:v=>Number(v)}
  });
  const handles = slider.querySelectorAll('.noUi-handle');
  if(handles[0]) handles[0].setAttribute('aria-label', "Année de début");
  if(handles[1]) handles[1].setAttribute('aria-label', "Année de fin");
  slider.noUiSlider.on('update', vals=>{
    sel.yStart=Number(vals[0]); sel.yEnd=Number(vals[1]);
    document.getElementById('yearStart').textContent=sel.yStart;
    document.getElementById('yearEnd').textContent=sel.yEnd;
    if(handles[0]){ handles[0].setAttribute('aria-valuenow', sel.yStart); handles[0].setAttribute('aria-valuetext', sel.yStart); }
    if(handles[1]){ handles[1].setAttribute('aria-valuenow', sel.yEnd); handles[1].setAttribute('aria-valuetext', sel.yEnd); }
  });
  slider.noUiSlider.on('set', render);

  // curseur plage en tonnes absolues (2 poignées) du graphe « Matières à faible valeur »
  // échelle non linéaire : plus de résolution vers 0-10 000 t (zone d'intérêt typique) que vers 600 000 t
  const smRange = document.getElementById('smallMatRangeSlider');
  if(smRange){
    if(smRange.noUiSlider) smRange.noUiSlider.destroy();
    noUiSlider.create(smRange, {
      start:[sel.smallMatMin, sel.smallMatMax], connect:true, margin:0,
      range:{min:0, '10%':100, '30%':1000, '50%':10000, '70%':100000, '90%':1000000, max:6000000},
      format:{to:v=>Math.round(v), from:v=>Number(v)}
    });
    const rangeHandles = smRange.querySelectorAll('.noUi-handle');
    if(rangeHandles[0]) rangeHandles[0].setAttribute('aria-label', "Valeur minimale (tonnes)");
    if(rangeHandles[1]) rangeHandles[1].setAttribute('aria-label', "Valeur maximale (tonnes)");
    smRange.noUiSlider.on('update', vals=>{
      sel.smallMatMin = Number(vals[0]); sel.smallMatMax = Number(vals[1]);
      document.getElementById('smallMatMinVal').textContent = sel.smallMatMin.toLocaleString('fr-FR');
      document.getElementById('smallMatMaxVal').textContent = sel.smallMatMax.toLocaleString('fr-FR');
      if(rangeHandles[0]){ rangeHandles[0].setAttribute('aria-valuenow', sel.smallMatMin); rangeHandles[0].setAttribute('aria-valuetext', sel.smallMatMin); }
      if(rangeHandles[1]){ rangeHandles[1].setAttribute('aria-valuenow', sel.smallMatMax); rangeHandles[1].setAttribute('aria-valuetext', sel.smallMatMax); }
    });
    smRange.noUiSlider.on('set', render);
  }
}

/**
 * Construit la barre de trajectoire : une carte par trajectoire du classeur (titre +
 * description + chiffre clé). Elle pilote tous les onglets, d'où sa position hors des filtres.
 * T1–T4 sont des références figées ; T′ Libre est éditable et mène à sa zone d'édition.
 */
function buildScenBar(){
  const host = document.getElementById('scenBtns');
  if(!host) return;
  host.innerHTML = scenList.map(s=>{
    const info = SCEN_INFO[s.id] || '';
    const meta = s.id==='TP'
      ? 'Personnalisable — clique pour l’éditer'
      : fmtUnites(parc2050(s.id))+' appareils en '+YEAR_MAX;
    const title = s.id==='TP'
      ? 'Trajectoire libre et éditable : ouvre l’onglet Paramètres pour la modifier.'
      : 'Trajectoire de référence (lecture seule).';
    const couleur = SCEN_COLORS[s.id] || '#555';
    return `<button type="button" class="scen-btn" data-scen="${esc(s.id)}" title="${esc(title)}"`
      + ` style="--scen:${esc(couleur)}">`
      + `<span class="scen-btn-nom">${esc(s.nom)}${s.vide ? ' <span class="scen-tag">à écrire</span>' : ''}</span>`
      + (info ? `<span class="scen-btn-desc">${esc(info)}</span>` : '')
      + `<span class="scen-btn-meta">${esc(meta)}</span>`
      + `</button>`;
  }).join('');
  host.querySelectorAll('[data-scen]').forEach(b=>b.onclick=()=>{
    const id = b.dataset.scen;
    setScenario(id);
    recompute();
    syncScenBar();
    if(id==='TP'){
      goToTrajEdit();                                 // T′ : va directement à la zone d'édition
    } else {
      if(currentPage==='traj'){ renderFacTables(); renderDvTable(); }
      render();
    }
  });
  const reset = document.getElementById('scenReset');
  if(reset) reset.onclick = ()=>{
    resetScenario();
    syncScenBar();
    if(currentPage==='traj'){ renderFacTables(); renderDvTable(); }
    render();
  };
  syncScenBar();
}

/**
 * Bascule sur l'onglet « Paramètres » et amène l'utilisateur droit à la zone
 * d'édition des facteurs de T′ (carte « Niveau d'équipement en 2050 »), avec une surbrillance.
 */
function goToTrajEdit(){
  const tab = document.getElementById('tab-traj');
  if(tab && currentPage!=='traj') tab.click();          // réutilise activateTab → render → renderTraj
  else render();                                        // déjà sur l'onglet : re-render pour l'état éditable
  requestAnimationFrame(()=>{
    const card = document.getElementById('facEditCard') || document.getElementById('facTables');
    if(!card) return;
    card.scrollIntoView({behavior:'smooth', block:'start'});
    card.classList.remove('flash'); void card.offsetWidth; card.classList.add('flash');
  });
}

/**
 * Aligne l'état visuel de la barre de trajectoire : la carte active suit la trajectoire
 * courante ; seule T′ peut porter la marque « modifiée » et afficher « valeurs d'origine ».
 */
function syncScenBar(){
  const surTP = scenNum.id === 'TP';
  document.querySelectorAll('[data-scen]').forEach(b=>{
    b.classList.toggle('active', b.dataset.scen === scenNum.id);
    b.classList.toggle('modifie', b.dataset.scen === 'TP' && libreState.edited);
  });
  const bar = document.getElementById('scenBar');
  if(bar) bar.classList.toggle('edited', surTP && libreState.edited);
  const reset = document.getElementById('scenReset');
  if(reset) reset.style.visibility = surTP ? '' : 'hidden';
  updateScenBadge();
}

/**
 * Valeurs « disponibles » d'une dimension = co-occurrence dans la vue (existence d'un
 * enregistrement, valeur 0 incluse). Ensemble de sélection vide = aucune contrainte.
 * @param {'energie'|'techno'|'matiere'} dim
 * @returns {Set<string>}
 */
function availFor(dim){
  const set = new Set(), t = effType();
  for(const r of records){
    if(r.type!==t) continue;
    if(dim!=='energie' && sel.energies.size && !sel.energies.has(r.energie)) continue;
    if(dim!=='techno'  && sel.technos.size  && !sel.technos.has(r.techno))   continue;
    if(dim!=='matiere' && sel.matieres.size && !sel.matieres.has(r.matiere)) continue;
    set.add(dim==='energie'?r.energie : dim==='techno'?r.techno : r.matiere);
  }
  return set;
}
/**
 * Désélectionne les items « sans lien » avec la sélection courante (sauf la dimension active),
 * en itérant jusqu'à stabilité (4 passes max).
 * @param {string} [activeDim] dimension que l'utilisateur vient de modifier
 */
function pruneUnlinked(activeDim){
  const list = [['energie',sel.energies],['techno',sel.technos],['matiere',sel.matieres]];
  for(let pass=0; pass<4; pass++){
    let changed = false;
    for(const [dim,selSet] of list){
      if(dim===activeDim) continue;
      const av = availFor(dim);
      for(const v of [...selSet]) if(!av.has(v)){ selSet.delete(v); changed=true; }
    }
    if(!changed) break;
  }
}
/**
 * Re-rend les 3 listes de filtres après élagage des sélections sans lien.
 * @param {string} [activeDim] dimension que l'utilisateur vient de modifier
 */
function renderFilters(activeDim){
  pruneUnlinked(activeDim);
  renderCheckList('matiere', 'matiereChecks', dims.matieres, availFor('matiere'), sel.matieres);
  renderCheckList('energie', 'energieChecks', dims.energies, availFor('energie'), sel.energies);
  renderCheckList('techno',  'technoChecks',  dims.technos,  availFor('techno'),  sel.technos);
}
/**
 * Rend une liste de cases à cocher : tout le domaine est affiché, les items sans lien sont
 * grisés (.unlinked) mais restent cliquables ; cochés en haut, non liés en bas.
 * @param {string} dim dimension ('energie'|'techno'|'matiere')
 * @param {string} containerId id du conteneur DOM
 * @param {string[]} domain toutes les valeurs de la dimension
 * @param {Set<string>} avail valeurs disponibles (cf. availFor)
 * @param {Set<string>} selSet sélection courante (mutée par les handlers)
 */
function renderCheckList(dim, containerId, domain, avail, selSet){
  const c = document.getElementById(containerId);
  const linked = domain.filter(v=>avail.has(v));
  const allChecked = linked.length>0 && linked.every(v=>selSet.has(v));
  // ordre : cochés en haut, puis non cochés liés ; les items « non liés » et non cochés
  // (sans donnée pour la vue courante, ex. paliers nucléaires sur certains types) sont masqués
  const ordered = [
    ...domain.filter(v=>selSet.has(v)),
    ...domain.filter(v=>!selSet.has(v) && avail.has(v)),
  ];
  const html = [`<label class="all" for="${containerId}-all"><input type="checkbox" id="${containerId}-all" ${allChecked?'checked':''}> Sélectionner tout</label>`]
    .concat(ordered.map((v,i)=>`<label class="${selSet.has(v)?'':'unlinked'}" for="${containerId}-${i}"><input type="checkbox" id="${containerId}-${i}" value="${esc(v)}" ${selSet.has(v)?'checked':''}> ${esc(v)}</label>`));
  if(!domain.length) html.push(`<div class="empty" style="padding:8px;font-size:12px">Aucune valeur disponible</div>`);
  c.innerHTML = html.join('');
  const cnt = document.getElementById(containerId.replace('Checks','Count'));
  if(cnt) cnt.textContent = `${selSet.size}/${domain.length}`;
  const allCb = c.querySelector('.all input');
  c.querySelectorAll('label:not(.all) input').forEach(cb=>cb.onchange=()=>{
    if(cb.checked) selSet.add(cb.value); else selSet.delete(cb.value);
    render(dim);
  });
  // « Sélectionner tout » ne coche que les items liés (les masqués n'ont pas de donnée ici) ; décocher vide tout
  allCb.onchange = ()=>{ if(allCb.checked) linked.forEach(v=>selSet.add(v)); else domain.forEach(v=>selSet.delete(v)); render(dim); };
}
/**
 * Remet les filtres (matières / énergies / technos + période) à « tout sélectionné ».
 */
function resetFilters(){
  sel.matieres = new Set(dims.matieres);
  sel.energies = new Set(dims.energies);
  sel.technos  = new Set(dims.technos);
  const sl = document.getElementById('yearSlider');
  if(sl && sl.noUiSlider) sl.noUiSlider.set([YEAR_MIN, YEAR_MAX]);   // met aussi à jour sel.yStart/yEnd via 'update'
  render();
}

/**
 * Records du type courant passant les filtres. Ensemble de sélection vide = aucune contrainte.
 * @returns {Array<Object>}
 */
function filtered(){
  const t = effType();
  return records.filter(r=>
    r.type===t &&
    (!sel.energies.size || sel.energies.has(r.energie)) &&
    (!sel.technos.size  || sel.technos.has(r.techno)) &&
    (!sel.matieres.size || sel.matieres.has(r.matiere)) &&
    r.annee>=sel.yStart && r.annee<=sel.yEnd);
}
