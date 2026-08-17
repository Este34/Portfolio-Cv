"use strict";

// ---- page de garde : bouton « Lancer » → animation puis choix du territoire ----
(function wireCover(){
  const cover=document.getElementById('cover'), btn=document.getElementById('coverLaunch');
  if(!cover||!btn) return;
  btn.onclick=()=>{
    cover.classList.add('leaving');
    setTimeout(()=>{ cover.style.display='none'; openRegionSelect(); }, 700);
  };
})();

// ---- barre de trajectoire : elle colle juste sous la barre d'onglets ----
// Les deux sont sticky ; sans décalage elles se superposent au défilement. La hauteur des
// onglets varie (ils passent à la ligne sur écran étroit), d'où la mesure au lieu d'une
// constante. Au-delà de 820 px la barre redevient statique (cf. media query).
(function collerBarreTrajectoire(){
  const tabs = document.getElementById('tabs'), bar = document.getElementById('scenBar');
  if(!tabs || !bar) return;
  const ECART_HAUT = 10, ECART_BAS = 6;      // top des onglets, puis respiration
  const sync = ()=>{
    const h = tabs.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--scenbar-top',
      (h ? ECART_HAUT + h + ECART_BAS : 0) + 'px');
  };
  // Une fois collée, la barre garderait sa hauteur de cartes (jusqu'à 55 % de l'écran) :
  // on la compacte alors (titre + chiffre clé seuls) pour laisser voir le contenu.
  //
  // Mais la barre est dans le flux : la rétrécir décale tout ce qui suit, et le navigateur
  // corrige alors le défilement — la page reculait de ~90 px, se décollait, se recollait…
  // en boucle. Une cale invisible reprend exactement la hauteur perdue : le flux ne bouge
  // plus, donc plus rien à corriger.
  const cale = document.createElement('div');
  cale.id = 'scenBarCale';
  cale.setAttribute('aria-hidden', 'true');
  bar.after(cale);

  let hauteurPleine = 0;
  const compacter = ()=>{
    const deplie = ()=>{ bar.classList.remove('compact'); cale.style.height = '0px'; };
    if(getComputedStyle(bar).position !== 'sticky'){ deplie(); return; }
    const haut = parseFloat(getComputedStyle(document.documentElement)
      .getPropertyValue('--scenbar-top')) || 0;
    const colle = bar.getBoundingClientRect().top <= haut + 1;
    if(!colle){
      deplie();
      hauteurPleine = bar.getBoundingClientRect().height;   // mesurée à l'état déplié
    } else if(!bar.classList.contains('compact')){
      hauteurPleine = hauteurPleine || bar.getBoundingClientRect().height;
      bar.classList.add('compact');                          // même frame que la cale :
      cale.style.height =                                    // le flux reste stable
        Math.max(0, hauteurPleine - bar.getBoundingClientRect().height) + 'px';
    }
  };
  const majTout = ()=>{ sync(); compacter(); };
  if(window.ResizeObserver) new ResizeObserver(majTout).observe(tabs);
  window.addEventListener('resize', majTout);
  window.addEventListener('scroll', compacter, {passive:true});
  // changer d'onglet change la hauteur du contenu : la mesure compact/cale devient obsolète.
  // On expose la re-mesure pour que la barre reste fixée en haut sans saut entre feuilles.
  window.recalerBarreTrajectoire = majTout;
  majTout();
})();

// ---- choix du territoire : national (Territoire national) ou régional ----
/** Ouvre l'écran de choix du territoire. */
function openRegionSelect(){
  const el = document.getElementById('regionSelect');
  if(el) el.classList.add('open');
}
/** Ferme l'écran de choix du territoire. */
function closeRegionSelect(){
  const el = document.getElementById('regionSelect');
  if(el) el.classList.remove('open');
}
/** Reflète le territoire courant : bandeau, bouton d'en-tête et carte sélectionnée. */
function updateRegionUI(){
  const b = document.getElementById('regionBtn');
  if(b) b.textContent = '⌖ ' + territoireNom();

  // bandeau : seulement hors « Territoire national », pour signaler des chiffres régionaux
  const ban = document.getElementById('regionBanner');
  if(ban){
    const regional = regionId !== 'fr';
    ban.classList.toggle('on', regional);
    ban.innerHTML = regional
      ? `<span class="rb-pin" aria-hidden="true">⌖</span>`
        + `<span>Territoire : <strong>${esc(territoireNom())}</strong>`
        + ` — tous les chiffres sont ramenés à ${pct(regionRatio*100, 2)} de le territoire</span>`
        + `<button type="button" class="rb-btn" id="regionBannerBtn">Changer</button>`
      : '';
    const rb = document.getElementById('regionBannerBtn');
    if(rb) rb.onclick = openRegionSelect;
  }
  document.querySelectorAll('[data-region]').forEach(c=>
    c.classList.toggle('active', c.dataset.region === regionId));
  const part = document.getElementById('regionPartOcc');
  const occ = regionsList.find(r=>r.id==='occ');
  if(part && occ) part.textContent = '· ' + pct(occ.ratio*100, 2) + ' de la population';
}
(function wireRegion(){
  document.querySelectorAll('[data-region]').forEach(c=>c.onclick=()=>{
    applyRegion(c.dataset.region);      // met les données à l'échelle puis re-rend
    closeRegionSelect();
  });
  const b = document.getElementById('regionBtn');
  if(b) b.onclick = openRegionSelect;
  document.addEventListener('keydown', e=>{
    // on ne ferme à l'échap que si un territoire est déjà appliqué
    if(e.key==='Escape') closeRegionSelect();
  });
})();

// ---- chargement automatique des données ----
(function autoload(){
  // pas de cache-buster : l'hébergeur (Vercel) revalide via ETag, le JSON n'est retéléchargé que s'il a changé
  fetch('./energie-data.json').then(r=>{ if(!r.ok) throw 0; return r.json(); })
    .then(ds=>{ try{ loadDataset(ds); }
                catch(e){ console.error(e); setStatus('Erreur des données : '+e.message, true); } })
    .catch(()=>setStatus('Données introuvables : energie-data.json manquant.', true));
})();

// ---- ergonomie : tiroir de filtres, puces de filtres actifs, retour en haut ----
(function ergonomie(){
  // pastille « trajectoire active » miroir : le backdrop-filter du header piège
  // les position:fixed, on duplique donc la pastille hors du header
  const srcBadge = document.getElementById('activeScenarioBadge');
  if(srcBadge){
    const mirror = document.createElement('div');
    mirror.id = 'scenBadgeFixed';
    mirror.className = 'scen-badge';
    mirror.setAttribute('aria-hidden', 'true');
    document.getElementById('tabs').appendChild(mirror);
    const syncBadge = ()=>{ mirror.textContent = srcBadge.textContent; };
    new MutationObserver(syncBadge).observe(srcBadge, {childList:true, characterData:true, subtree:true});
    syncBadge();
  }

  // tiroir de filtres : bouton flottant « ☰ Filtres », fermeture par Échap ;
  // masqué sur les pages pleine largeur où #filters est déjà masqué
  const filters = document.getElementById('filters');
  if(filters){
    const fBtn = document.createElement('button');
    fBtn.type = 'button';
    fBtn.id = 'drawerFiltersBtn';
    fBtn.textContent = '☰ Filtres';
    fBtn.setAttribute('aria-controls', 'filters');
    fBtn.setAttribute('aria-expanded', 'false');
    fBtn.addEventListener('click', ()=>{
      const open = filters.classList.toggle('drawer-open');
      fBtn.setAttribute('aria-expanded', String(open));
      window.dispatchEvent(new Event('resize'));
    });
    document.body.appendChild(fBtn);
    document.addEventListener('keydown', e=>{
      if(e.key === 'Escape' && filters.classList.contains('drawer-open')){
        filters.classList.remove('drawer-open');
        fBtn.setAttribute('aria-expanded', 'false');
      }
    });
    // synchronisation par observation du style de #filters : fiable quel que soit le déclencheur
    // (clic OU navigation clavier des onglets), contrairement à un listener click seul
    const syncFBtn = ()=>{ fBtn.style.visibility = (filters.style.display === 'none') ? 'hidden' : ''; };
    new MutationObserver(syncFBtn).observe(filters, {attributes:true, attributeFilter:['style']});
    syncFBtn();
  }

  // puces des filtres actifs, au-dessus des KPIs
  const kpisEl = document.getElementById('kpis');
  const chips = document.createElement('div');
  chips.id = 'ergoChips';
  chips.setAttribute('aria-label', 'Filtres actifs');
  if(kpisEl) kpisEl.parentNode.insertBefore(chips, kpisEl);
  const yearSliderApi = ()=>{ const el = document.getElementById('yearSlider'); return el && el.noUiSlider; };
  function renderChips(){
    chips.innerHTML = '';
    [['matiereCount','Matières','matiereChecks'],
     ['energieCount','Thèmes','energieChecks'],
     ['technoCount','Équipements','technoChecks']].forEach(g=>{
      const cnt = document.getElementById(g[0]);
      const m = cnt && /^(\d+)\/(\d+)$/.exec(cnt.textContent.trim());
      if(!m) return;
      const checked = +m[1], total = +m[2];
      if(!(checked > 0 && checked < total)) return;   // 0 = aucune contrainte, total = tout
      const chip = document.createElement('span');
      chip.className = 'ergo-chip';
      chip.textContent = g[1] + ' : ' + checked + '/' + total + ' ';
      const x = document.createElement('button');
      x.type = 'button'; x.textContent = '✕';
      x.title = 'Retirer ce filtre (tout sélectionner)';
      x.setAttribute('aria-label', 'Retirer le filtre ' + g[1]);
      x.addEventListener('click', ()=>{
        const all = document.querySelector('#' + g[2] + ' .all input');
        if(all && !all.checked) all.click();
      });
      chip.appendChild(x);
      chips.appendChild(chip);
    });
    const s = yearSliderApi();
    const ys = document.getElementById('yearStart'), ye = document.getElementById('yearEnd');
    if(s && ys && ye){
      const min = s.options.range.min, max = s.options.range.max;
      if(+ys.textContent !== min || +ye.textContent !== max){
        const chip = document.createElement('span');
        chip.className = 'ergo-chip';
        chip.textContent = 'Années : ' + ys.textContent + '–' + ye.textContent + ' ';
        const x = document.createElement('button');
        x.type = 'button'; x.textContent = '✕';
        x.title = 'Revenir à la période complète';
        x.setAttribute('aria-label', 'Retirer le filtre années');
        x.addEventListener('click', ()=>{ const sl = yearSliderApi(); if(sl) sl.set([min, max]); });
        chip.appendChild(x);
        chips.appendChild(chip);
      }
    }
  }
  ['matiereCount','energieCount','technoCount','yearStart','yearEnd'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) new MutationObserver(renderChips).observe(el, {childList:true, characterData:true, subtree:true});
  });
  renderChips();

  // bouton retour en haut
  const topBtn = document.createElement('button');
  topBtn.type = 'button'; topBtn.id = 'ergoTopBtn';
  topBtn.textContent = '↑';
  topBtn.title = 'Haut de page';
  topBtn.setAttribute('aria-label', 'Revenir en haut de page');
  topBtn.addEventListener('click', ()=>window.scrollTo({top:0, behavior:'smooth'}));
  document.body.appendChild(topBtn);
  window.addEventListener('scroll', ()=>{ topBtn.classList.toggle('show', window.scrollY > 600); }, {passive:true});

  // puces de matières (page Soutenabilité) : un clic = matière analysée
  const soutSel = document.getElementById('soutMatSel');
  const matBar = document.createElement('div');
  matBar.id = 'ergoMatChips';
  matBar.setAttribute('role', 'group');
  matBar.setAttribute('aria-label', 'Choix rapide de la matière analysée');
  const soutCtrl = document.querySelector('.sout-ctrl');
  if(soutCtrl) soutCtrl.insertAdjacentElement('afterend', matBar);
  function renderMatChips(){
    matBar.innerHTML = '';
    if(!soutSel) return;
    [...soutSel.options].forEach(opt=>{
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = opt.value;
      b.classList.toggle('active', opt.value === soutSel.value);
      b.addEventListener('click', ()=>{
        soutSel.value = opt.value;
        soutSel.dispatchEvent(new Event('change'));
        renderMatChips();
      });
      matBar.appendChild(b);
    });
  }
  if(soutSel){
    new MutationObserver(renderMatChips).observe(soutSel, {childList:true});
    soutSel.addEventListener('change', renderMatChips);
    renderMatChips();
  }
})();
