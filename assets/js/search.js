/* =========================================================
   Site search: every page, role, responsibility, skill,
   credential, book, and FAQ. Open with the nav button,
   Cmd/Ctrl + K, or "/".
   ========================================================= */
(() => {
  const SRC = new URL('../search-index.json', document.currentScript.src).href;
  const KINDS = ['Page', 'Experience', 'Work', 'Section', 'Responsibility', 'Credential', 'Skill', 'Book', 'Inspiration', 'FAQ'];
  const SUGGEST = ['Email automation', 'Google Business Profile', 'HubSpot', 'Schema', 'Website design', 'StoryBrand'];
  let data = null, loading = null, results = [], active = 0;
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const norm = s => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  /* ---------- UI ---------- */
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'sx-btn';
  btn.setAttribute('aria-label', 'Search the site'); btn.setAttribute('aria-haspopup', 'dialog');
  btn.innerHTML = `<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span>Search</span><kbd>${isMac ? '⌘' : 'Ctrl'} K</kbd>`;
  const slot = document.querySelector('[data-search-slot]');
  if (slot) slot.append(btn); else document.body.append(btn);

  const box = document.createElement('div');
  box.className = 'sx'; box.hidden = true;
  box.innerHTML = `
    <div class="sx-scrim" data-close></div>
    <section class="sx-panel" role="dialog" aria-modal="true" aria-labelledby="sx-label">
      <h2 class="sr-only" id="sx-label">Search rileycatalano.com</h2>
      <div class="sx-field">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <label class="sr-only" for="sx-input">Search skills, roles, credentials, and pages</label>
        <input id="sx-input" type="search" autocomplete="off" spellcheck="false" placeholder="Search skills, roles, credentials, pages…" role="combobox" aria-expanded="true" aria-controls="sx-list" aria-autocomplete="list">
        <button type="button" class="sx-esc" data-close>Esc</button>
      </div>
      <div class="sx-body" data-lenis-prevent>
        <div class="sx-start"><p class="sx-k">Try</p><div class="sx-chips">${SUGGEST.map(s => `<button type="button" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
        <ul class="sx-list" id="sx-list" role="listbox" aria-label="Results"></ul>
        <p class="sx-empty" hidden></p>
      </div>
      <footer class="sx-foot"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span><span class="sx-count" aria-live="polite"></span></footer>
    </section>`;
  document.body.append(box);
  const input = box.querySelector('#sx-input'), list = box.querySelector('.sx-list');
  const empty = box.querySelector('.sx-empty'), start = box.querySelector('.sx-start'), count = box.querySelector('.sx-count');

  const load = () => loading || (loading = fetch(SRC).then(r => r.json()).then(d => {
    data = d.map(it => ({ ...it, _t: norm(it.t), _h: norm(`${it.t} ${it.s} ${it.k} ${it.x}`) }));
  }).catch(() => { data = []; }));

  /* ---------- Matching ---------- */
  const search = q => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const out = [];
    for (const it of data) {
      if (!words.every(w => it._h.includes(w))) continue;
      let score = 0;
      const full = words.join(' ');
      if (it._t === full) score += 100;
      else if (it._t.startsWith(full)) score += 60;
      else if (it._t.includes(full)) score += 40;
      for (const w of words) if (it._t.includes(w)) score += 8;
      score += (10 - KINDS.indexOf(it.k)) * 1.5;
      out.push([score, it]);
    }
    return out.sort((a, b) => b[0] - a[0]).slice(0, 40).map(x => x[1]);
  };
  const mark = (text, q) => {
    let html = esc(text);
    norm(q).split(/\s+/).filter(w => w.length > 1).forEach(w => {
      html = html.replace(new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig'), '<mark>$1</mark>');
    });
    return html;
  };

  const render = () => {
    const q = input.value.trim();
    start.hidden = !!q;
    if (!q) { list.innerHTML = ''; empty.hidden = true; count.textContent = ''; return; }
    if (!data) { load().then(render); return; }
    results = search(q); active = 0;
    // group by kind, in KINDS order
    const order = [...new Set(results.map(r => r.k))];
    const groups = order.map(k => [k, results.filter(r => r.k === k)]);
    results = groups.flatMap(g => g[1]);
    let i = 0;
    list.innerHTML = groups.map(([k, rs]) => `<li class="sx-group" role="presentation">${({ Responsibility: 'Responsibilities', Inspiration: 'Inspiration', Experience: 'Experience', Work: 'Work', FAQ: 'FAQ' })[k] || k + 's'}</li>` +
      rs.map(r => `<li role="option" id="sx-o${i}" class="sx-item" data-i="${i++}" aria-selected="false"><a href="${esc(r.u)}"><span class="sx-t">${mark(r.t, q)}</span><span class="sx-s">${esc(r.s)}</span></a></li>`).join('')).join('');
    empty.hidden = results.length > 0;
    empty.innerHTML = `Nothing yet for “${esc(q)}”. <a href="#text-riley" data-close>Ask me in a text</a> and I’ll answer personally.`;
    count.textContent = results.length ? `${results.length}${results.length === 40 ? '+' : ''} results` : '';
    setActive(0);
  };
  const setActive = n => {
    const opts = list.querySelectorAll('.sx-item');
    if (!opts.length) { input.removeAttribute('aria-activedescendant'); return; }
    active = (n + opts.length) % opts.length;
    opts.forEach((o, j) => o.setAttribute('aria-selected', String(j === active)));
    input.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  };

  /* ---------- Open / close ---------- */
  let lastFocus = null;
  const open = (q = '') => {
    lastFocus = document.activeElement;
    box.hidden = false; document.documentElement.classList.add('sx-open');
    requestAnimationFrame(() => box.classList.add('is-open'));
    load();
    input.value = q; render();
    setTimeout(() => input.focus(), 30);
  };
  const close = () => {
    box.classList.remove('is-open'); document.documentElement.classList.remove('sx-open');
    setTimeout(() => { if (!box.classList.contains('is-open')) box.hidden = true; }, 200);
    lastFocus && lastFocus.focus && lastFocus.focus();
  };
  const go = () => {
    const a = list.querySelector(`.sx-item[data-i="${active}"] a`);
    if (a) { close(); location.href = a.href; }
  };

  btn.addEventListener('click', () => open());
  document.querySelectorAll('[data-search-open]').forEach(el => el.addEventListener('click', e => { e.preventDefault(); open(); }));
  box.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { if (e.target.closest('a')) { close(); return; } close(); }
    const chip = e.target.closest('[data-q]'); if (chip) { input.value = chip.dataset.q; render(); input.focus(); }
    const link = e.target.closest('.sx-item a'); if (link) close();
  });
  list.addEventListener('mousemove', e => { const it = e.target.closest('.sx-item'); if (it) setActive(+it.dataset.i); });
  input.addEventListener('input', render);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); go(); }
  });
  addEventListener('keydown', e => {
    const typing = e.target.matches('input,textarea,[contenteditable]');
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); box.hidden ? open() : close(); }
    else if (e.key === '/' && !typing && box.hidden) { e.preventDefault(); open(); }
    else if (e.key === 'Escape' && !box.hidden) { e.preventDefault(); close(); }
    else if (e.key === 'Tab' && !box.hidden) {
      const f = [...box.querySelectorAll('input,button,a[href]')].filter(x => x.offsetParent);
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });
  // warm the index after the page settles
  if (window.requestIdleCallback) requestIdleCallback(() => load(), { timeout: 4000 }); else setTimeout(load, 2500);
})();
