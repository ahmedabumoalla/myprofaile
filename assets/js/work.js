// Work page: fan stack carousel, MVP/Pitch tabs, project detail overlay
(function(){
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.documentElement.style.height = '100%';
  document.body.style.height = '100vh';

  const PROJECTS = window.PlatformData.PROJECTS;
  const PITCH_PROJECTS = window.PlatformData.PITCH_PROJECTS;

  const fanStage = document.getElementById('fanStage');
  const fanFloat = document.getElementById('fanFloat');
  const tabMvp = document.getElementById('tabMvp');
  const tabPitch = document.getElementById('tabPitch');

  let viewMode = 'mvp';
  let featuredIndex = 0;
  let fanMounted = false;
  let fanMoved = false;
  let fanDragging = false;

  function activeList(){ return viewMode === 'pitch' ? PITCH_PROJECTS : PROJECTS; }

  function updateTabs(){
    tabMvp.style.cssText = `padding:10px 26px;border-radius:999px;border:none;font-size:14px;font-weight:600;cursor:pointer;background:${viewMode === 'mvp' ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent'};color:${viewMode === 'mvp' ? '#fff' : 'var(--text-dim)'};box-shadow:${viewMode === 'mvp' ? '0 8px 24px rgba(239,74,35,.35)' : 'none'};`;
    tabPitch.style.cssText = `padding:10px 26px;border-radius:999px;border:none;font-size:14px;font-weight:600;cursor:pointer;background:${viewMode === 'pitch' ? 'linear-gradient(135deg, var(--accent), var(--accent-2))' : 'transparent'};color:${viewMode === 'pitch' ? '#fff' : 'var(--text-dim)'};box-shadow:${viewMode === 'pitch' ? '0 8px 24px rgba(239,74,35,.35)' : 'none'};`;
  }
  updateTabs();

  function renderFan(){
    const lang = window.Platform.getLang();
    const list = activeList();
    const n = list.length;
    fanStage.innerHTML = '';
    list.forEach((p, i) => {
      let offset = i - featuredIndex;
      if(offset > n/2) offset -= n;
      if(offset < -n/2) offset += n;
      const absOff = Math.abs(offset);
      const isCenter = offset === 0;
      const visible = absOff <= 2;
      const rot = fanMounted ? offset * 6 : 0;
      const rotY = fanMounted ? offset * -16 : 0;
      const tx = fanMounted ? `calc(${offset} * 13vw)` : '0px';
      const ty = fanMounted ? absOff * 16 : 100;
      const tz = fanMounted ? -absOff * 140 : -320;
      const scale = fanMounted ? (isCenter ? 1 : (absOff === 1 ? 0.82 : 0.66)) : 0.5;
      const opacity = !visible ? 0 : (!fanMounted ? 0 : (isCenter ? 1 : (absOff === 1 ? 0.65 : 0.35)));
      const z = 10 - absOff;
      const w = 'clamp(380px,36vw,560px)', h = 'clamp(260px,40vh,420px)';
      const delay = fanMounted ? absOff * 70 : 0;
      const baseTransform = `translateX(${tx}) translateY(${ty}px) translateZ(${tz}px) rotate(${rot}deg) rotateY(${rotY}deg) scale(${scale})`;
      const filter = isCenter ? 'none' : `grayscale(0.85) brightness(.6) blur(${absOff * 1.5}px)`;
      const card = document.createElement('div');
      card.style.cssText = `position:absolute;width:${w};height:${h};border-radius:24px;overflow:hidden;cursor:pointer;transform-style:preserve-3d;will-change:transform;box-shadow:${isCenter ? '0 60px 120px rgba(0,0,0,.65),0 0 50px rgba(239,74,35,.18)' : '0 30px 60px rgba(0,0,0,.5)'};transform:${baseTransform};opacity:${opacity};z-index:${z};transition:transform .8s cubic-bezier(.22,1.15,.36,1) ${delay}ms,opacity .6s ease ${delay}ms,filter .5s ease,box-shadow .3s ease;pointer-events:${visible && fanMounted ? 'auto' : 'none'};background:var(--surface);`;
      card.innerHTML = `
        <img src="${p.image}" draggable="false" style="width:100%;height:100%;object-fit:cover;pointer-events:none;filter:${filter};" alt="${p.title[lang]}">
        <div style="position:absolute;inset:0;background:linear-gradient(0deg, rgba(0,0,0,.6) 0%, transparent 48%);"></div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:22px;">
          <div style="color:#fff;font-weight:600;font-size:17px;">${p.title[lang]}</div>
        </div>`;
      if(isCenter){
        card.addEventListener('mouseenter', () => { card.style.transform = `${baseTransform} translateY(-12px) scale(${scale * 1.02})`; card.style.boxShadow = '0 70px 140px rgba(0,0,0,.7),0 0 70px rgba(239,74,35,.32)'; });
        card.addEventListener('mouseleave', () => { card.style.transform = baseTransform; card.style.boxShadow = '0 60px 120px rgba(0,0,0,.65),0 0 50px rgba(239,74,35,.18)'; });
      }
      card.addEventListener('click', () => {
        if(fanMoved) return;
        isCenter ? openProject(i) : setFeatured(i);
      });
      fanStage.appendChild(card);
    });
  }
  function setFeatured(i){ featuredIndex = i; renderFan(); }
  function prevFeatured(){ featuredIndex = (featuredIndex - 1 + activeList().length) % activeList().length; renderFan(); }
  function nextFeatured(){ featuredIndex = (featuredIndex + 1) % activeList().length; renderFan(); }

  const comingSoonModal = document.getElementById('comingSoonModal');
  function setMode(mode){
    if(mode === 'pitch'){ comingSoonModal.style.display = 'flex'; return; }
    if(viewMode === mode) return;
    viewMode = mode; featuredIndex = 0; updateTabs(); renderFan();
  }
  tabMvp.addEventListener('click', () => setMode('mvp'));
  tabPitch.addEventListener('click', () => setMode('pitch'));
  document.getElementById('closeComingSoon').addEventListener('click', () => comingSoonModal.style.display = 'none');
  comingSoonModal.addEventListener('click', (e) => { if(e.target === comingSoonModal) comingSoonModal.style.display = 'none'; });

  document.addEventListener('platform:lang', renderFan);

  requestAnimationFrame(() => setTimeout(() => { fanMounted = true; renderFan(); }, 60));
  renderFan();

  // ===== drag =====
  (function setupFanDrag(){
    let isDown = false, startX = 0;
    const down = (x) => { isDown = true; fanMoved = false; fanDragging = true; startX = x; fanStage.style.cursor = 'grabbing'; };
    const move = (x) => {
      if(!isDown) return;
      const dragX = x - startX;
      if(Math.abs(dragX) > 6) fanMoved = true;
      fanStage.style.transform = `perspective(2000px) translateX(${dragX}px)`;
    };
    const up = (x) => {
      if(!isDown) return; isDown = false; fanDragging = false; fanStage.style.cursor = 'grab';
      const dx = x - startX;
      fanStage.style.transform = 'perspective(2000px)';
      if(Math.abs(dx) > 40){ dx < 0 ? nextFeatured() : prevFeatured(); }
    };
    fanStage.addEventListener('mousedown', (e) => down(e.pageX));
    window.addEventListener('mousemove', (e) => move(e.pageX));
    window.addEventListener('mouseup', (e) => up(e.pageX));
    fanStage.addEventListener('touchstart', (e) => down(e.touches[0].pageX), { passive:true });
    fanStage.addEventListener('touchmove', (e) => move(e.touches[0].pageX), { passive:true });
    fanStage.addEventListener('touchend', (e) => up(e.changedTouches[0].pageX));
  })();

  // ===== parallax =====
  window.addEventListener('mousemove', (e) => {
    if(fanDragging) return;
    const w = window.innerWidth, h = window.innerHeight;
    const px = ((e.clientX / w) - 0.5) * 2 * 12;
    const py = ((e.clientY / h) - 0.5) * 2 * 12;
    fanStage.style.transform = `perspective(2000px) translate(${px}px, ${py}px)`;
  });

  // ===== hover switch =====
  (function setupHoverSwitch(){
    let lastX = null, cooldown = false;
    fanStage.addEventListener('mouseleave', () => { lastX = null; });
    fanStage.addEventListener('mousemove', (e) => {
      if(fanDragging) return;
      if(lastX === null){ lastX = e.clientX; return; }
      const dx = e.clientX - lastX;
      if(cooldown) return;
      if(Math.abs(dx) > 45){
        dx < 0 ? nextFeatured() : prevFeatured();
        lastX = e.clientX;
        cooldown = true;
        setTimeout(() => { cooldown = false; lastX = null; }, 320);
      } else {
        lastX = e.clientX;
      }
    });
  })();

  // ===== project detail overlay =====
  const detailEl = document.getElementById('projectDetail');

  function renderProject(i){
    const lang = window.Platform.getLang();
    const list = activeList();
    const p = list[i];
    document.getElementById('pdImage').src = p.image;
    document.getElementById('pdImage').alt = p.title[lang];
    document.getElementById('pdImage2').src = p.image;
    document.getElementById('pdImage2').alt = p.title[lang];
    document.getElementById('pdTitle').textContent = p.title[lang];
    document.getElementById('pdProblem').textContent = p.problem[lang];
    document.getElementById('pdStats').innerHTML = p.stats.map(s => `
      <div class="liquid-glass" style="border-radius:16px;padding:18px 24px;min-width:150px;">
        <div style="font-weight:600;font-size:clamp(22px,2.4vw,28px);color:var(--accent);letter-spacing:-.02em;margin-bottom:4px;">${s.value}</div>
        <div style="font-size:13px;color:var(--text-dim);">${s.label[lang]}</div>
      </div>`).join('');
    document.getElementById('pdDescription').textContent = p.description[lang];
    document.getElementById('pdTech').innerHTML = p.tech.map(t => `<span class="liquid-glass" style="padding:6px 14px;border-radius:999px;font-size:12.5px;color:var(--text);">${t}</span>`).join('');
    document.getElementById('pdAchievements').innerHTML = p.achievements[lang].map(a => `
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex:none;margin-top:3px;"><path d="M20 6 9 17l-5-5"></path></svg>
        <span style="font-size:14.5px;color:var(--text-dim);line-height:1.6;">${a}</span>
      </div>`).join('');
    const related = list.filter((_, ri) => ri !== i).slice(0, 3);
    document.getElementById('pdRelated').innerHTML = related.map(rp => {
      const realIdx = list.indexOf(rp);
      return `<div data-idx="${realIdx}" class="pd-related-card" style="cursor:pointer;color:var(--text);border:1px solid var(--glass-border);border-radius:18px;overflow:hidden;background:var(--surface);transition:border-color .25s,transform .25s;">
        <div style="position:relative;aspect-ratio:16/11;overflow:hidden;background:var(--bg-2);">
          <img src="${rp.image}" style="width:100%;height:100%;object-fit:cover;" alt="${rp.title[lang]}">
        </div>
        <div style="padding:20px;">
          <h3 style="margin:0;font-size:16.5px;font-weight:600;">${rp.title[lang]}</h3>
        </div>
      </div>`;
    }).join('');
    document.querySelectorAll('.pd-related-card').forEach(el => {
      el.addEventListener('click', () => openProject(parseInt(el.dataset.idx, 10)));
    });
  }

  function openProject(i, pushHistory){
    renderProject(i);
    detailEl.style.display = 'block';
    detailEl.style.animation = 'blurFadeUp .4s ease-out';
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    window.scrollTo(0,0);
    if(pushHistory !== false) history.pushState({ project:i }, '', '#project-' + i);
  }
  function closeProject(){
    detailEl.style.display = 'none';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    if(location.hash) history.back();
  }
  document.getElementById('pdClose').addEventListener('click', closeProject);
  window.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeProject(); });
  window.addEventListener('popstate', () => {
    const m = /^#project-(\d+)$/.exec(location.hash);
    if(m) openProject(parseInt(m[1],10), false);
    else closeProject();
  });

  const hashMatch = /^#project-(\d+)$/.exec(location.hash);
  if(hashMatch){
    const idx = parseInt(hashMatch[1], 10);
    if(idx >= 0 && idx < activeList().length) openProject(idx, false);
  }
})();
