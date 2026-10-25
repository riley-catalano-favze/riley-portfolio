/* Riley Catalano · site interactions (vanilla JS, no build step) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('rm');
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && fine && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    $$('a[href^="#"], a[href^="/#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href').replace('/', '');
      const el = id.length > 1 && document.querySelector(id);
      if (el && (location.pathname === '/' || location.pathname.endsWith('index.html') || a.getAttribute('href').startsWith('#'))) {
        e.preventDefault(); closeMenu(); lenis.scrollTo(el, { offset: -20, duration: 1.4 });
        history.replaceState(null, '', id);
      }
    }));
  }

  /* ---------- Scroll-linked UI ---------- */
  const progress = $('.progress');
  const nav = $('.nav');
  const darkZones = $$('[data-theme="dark"]');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    if (progress) progress.style.setProperty('--p', max > 0 ? y / max : 0);
    if (nav) {
      if (!document.body.classList.contains('menu-open')) nav.classList.toggle('is-hidden', y > lastY && y > 400);
      const navY = 40;
      nav.classList.toggle('on-dark', darkZones.some(z => { const r = z.getBoundingClientRect(); return r.top <= navY && r.bottom >= navY; }));
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('.menu-btn');
  function closeMenu() { document.body.classList.remove('menu-open'); menuBtn && menuBtn.setAttribute('aria-expanded', 'false'); lenis && lenis.start(); }
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      const open = document.body.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open);
      lenis && (open ? lenis.stop() : lenis.start());
    });
    $$('.mobile-menu a').forEach(a => a.addEventListener('click', closeMenu));
    addEventListener('keydown', e => e.key === 'Escape' && closeMenu());
  }

  /* ---------- Cursor ---------- */
  if (fine && !reduce) {
    const dot = $('.cursor'), ring = $('.cursor-ring'), label = ring && ring.querySelector('span');
    if (dot && ring) {
      let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
      addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; document.body.classList.add('has-cursor'); }, { passive: true });
      document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
      const tick = () => {
        rx = lerp(rx, x, .18); ry = lerp(ry, y, .18);
        dot.style.transform = `translate3d(${x}px,${y}px,0)`;
        ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
        requestAnimationFrame(tick);
      };
      tick();
      document.addEventListener('mouseover', e => {
        const t = e.target.closest('a,button,summary,[data-cursor],input,label');
        const l = t && t.closest('[data-cursor]');
        ring.classList.toggle('is-hover', !!t && !l);
        ring.classList.toggle('is-label', !!l);
        dot.classList.toggle('is-hidden', !!l);
        if (l && label) label.textContent = l.dataset.cursor;
      });
    }
  }

  /* ---------- Magnetic ---------- */
  if (fine && !reduce) $$('[data-magnetic]').forEach(el => {
    const s = +el.dataset.magnetic || .35;
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * s}px,${(e.clientY - r.top - r.height / 2) * s}px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });

  /* ---------- Split text + reveal ---------- */
  $$('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.append(inner); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
    walk(el);
    $$('.w', el).forEach(w => w.setAttribute('aria-hidden', 'true'));
    el.classList.add('split');
  });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .15, rootMargin: '0px 0px -6% 0px' });
  $$('[data-reveal],[data-split],.bars,.bar').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  const fmt = n => n.toLocaleString('en-US');
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target, to = +el.dataset.count, dur = reduce ? 0 : 1800, t0 = performance.now();
    const step = t => {
      const p = dur ? clamp((t - t0) / dur, 0, 1) : 1;
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - p, 4))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step); cio.unobserve(el);
  }), { threshold: .4 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- Hero: kinetic type + aurora parallax ---------- */
  const hero = $('.hero');
  const kin = $('.kinetic');
  if (kin) {
    $$('.row', kin).forEach(row => {
      const txt = row.textContent; row.textContent = '';
      [...txt].forEach(c => { const s = document.createElement('span'); s.className = 'ch'; s.textContent = c; row.append(s); });
    });
    const chars = $$('.ch', kin);
    const setChar = (c, f) => {
      c.style.setProperty('--w', Math.round(lerp(820, 900, f) - (1 - f) * 0));
      c.style.setProperty('--s', lerp(62, 118, f).toFixed(1) + '%');
      c.classList.toggle('hot', f > .55);
    };
    if (fine && !reduce) {
      let mx = -9999, my = -9999, pending = false;
      const update = () => {
        pending = false;
        chars.forEach(c => {
          const r = c.getBoundingClientRect();
          const d = Math.hypot(mx - (r.left + r.width / 2), my - (r.top + r.height / 2));
          setChar(c, clamp(1 - d / 340, 0, 1));
        });
      };
      hero.addEventListener('mousemove', e => {
        mx = e.clientX; my = e.clientY;
        hero.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
        hero.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
        if (!pending) { pending = true; requestAnimationFrame(update); }
      });
      hero.addEventListener('mouseleave', () => { mx = my = -9999; update(); });
    } else if (!reduce) {
      // Touch devices: a gentle wave travels through the name
      let t = 0;
      const wave = () => {
        t += .028;
        chars.forEach((c, i) => setChar(c, Math.max(0, Math.sin(t - i * .45)) ** 3));
        requestAnimationFrame(wave);
      };
      const hio = new IntersectionObserver(([e]) => { if (e.isIntersecting && !wave.on) { wave.on = 1; wave(); } });
      hio.observe(kin);
    }
    if (!reduce) {
      const rows = $$('.row', kin);
      addEventListener('scroll', () => {
        const y = scrollY; if (y > innerHeight * 1.2) return;
        rows[0].style.transform = `translate3d(${-y * .35}px,0,0)`;
        rows[1] && (rows[1].style.transform = `translate3d(${y * .25}px,0,0)`);
        kin.style.opacity = clamp(1 - y / (innerHeight * .9), 0, 1);
      }, { passive: true });
    }
  }
  $$('.page-hero,.finale').forEach(h => {
    if (!fine || reduce) return;
    h.addEventListener('mousemove', e => {
      h.style.setProperty('--mx', (e.clientX / innerWidth - .5).toFixed(3));
      h.style.setProperty('--my', (e.clientY / innerHeight - .5).toFixed(3));
    });
  });

  /* ---------- Word rotator ---------- */
  $$('.rotator').forEach(r => {
    const items = $$('span', r); let i = 0;
    items[0].classList.add('on');
    if (reduce || items.length < 2) return;
    setInterval(() => {
      const cur = items[i]; i = (i + 1) % items.length; const nxt = items[i];
      cur.classList.remove('on'); cur.classList.add('out');
      nxt.classList.remove('out'); nxt.classList.add('on');
      setTimeout(() => cur.classList.remove('out'), 900);
    }, 2400);
  });

  /* ---------- Story: horizontal pinned timeline ---------- */
  const story = $('.story');
  if (story) {
    const pin = $('.story-pin', story), track = $('.story-track', story), rail = $('.rail', story);
    const years = $$('.story-years span', story), chapters = $$('.chapter', track);
    let dist = 0;
    const stacked = () => reduce || innerWidth < 900;
    const layout = () => {
      story.classList.toggle('is-stacked', stacked());
      if (stacked()) { pin.style.height = ''; return; }
      dist = track.scrollWidth - innerWidth;
      pin.style.height = (dist + innerHeight) + 'px';
      onStory();
    };
    const onStory = () => {
      if (stacked()) return;
      const top = pin.getBoundingClientRect().top;
      const p = clamp(-top / dist, 0, 1);
      track.style.transform = `translate3d(${-p * dist}px,0,0)`;
      rail && rail.style.setProperty('--sp', p);
      const idx = Math.round(p * (years.length - 1));
      years.forEach((y, i) => y.classList.toggle('on', i <= idx));
      chapters.forEach(c => {
        const r = c.getBoundingClientRect(); const mid = r.left + r.width / 2;
        const f = clamp(1 - Math.abs(mid - innerWidth / 2) / innerWidth, .6, 1);
        c.style.transform = `scale(${lerp(.92, 1, (f - .6) / .4)})`;
      });
    };
    addEventListener('scroll', onStory, { passive: true });
    addEventListener('resize', layout);
    document.fonts ? document.fonts.ready.then(layout) : layout();
    layout();
  }

  /* ---------- iMessage proof sequence ---------- */
  const thread = $('.thread');
  if (thread) {
    const steps = $$('[data-step]', thread).sort((a, b) => a.dataset.step - b.dataset.step);
    const run = async () => {
      const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
      for (const el of steps) {
        const kind = el.dataset.kind;
        if (kind === 'typing') { el.hidden = false; await wait(30); el.classList.add('in'); await wait(1300); el.classList.remove('in'); await wait(200); el.hidden = true; }
        else if (kind === 'tapback') { await wait(450); el.classList.add('pop'); burst(el, 8); }
        else { el.classList.add('in'); await wait(900); }
      }
    };
    const tio = new IntersectionObserver(([e]) => { if (e.isIntersecting) { tio.disconnect(); run(); } }, { threshold: .45 });
    tio.observe(thread);
    const phone = $('.phone');
    if (phone && !reduce) addEventListener('scroll', () => {
      const r = phone.getBoundingClientRect();
      phone.style.setProperty('--py', ((r.top + r.height / 2 - innerHeight / 2) * -.06).toFixed(1) + 'px');
    }, { passive: true });
  }

  /* ---------- Scroll-scrubbed quote ---------- */
  $$('[data-scrub]').forEach(q => {
    const words = q.textContent.trim().split(/\s+/); const accent = (q.dataset.accent || '').toLowerCase().split(',');
    q.setAttribute('aria-label', q.textContent.trim()); q.textContent = '';
    const spans = words.map(w => {
      const s = document.createElement('span'); s.className = 'w'; s.setAttribute('aria-hidden', 'true');
      if (accent.includes(w.toLowerCase().replace(/[^a-z]/g, ''))) s.classList.add('accent');
      s.textContent = w; q.append(s, ' '); return s;
    });
    if (reduce) { spans.forEach(s => s.classList.add('lit')); return; }
    const upd = () => {
      const r = q.getBoundingClientRect();
      const p = clamp((innerHeight * .85 - r.top) / (r.height + innerHeight * .35), 0, 1);
      const n = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle('lit', i < n));
    };
    addEventListener('scroll', upd, { passive: true }); upd();
  });

  /* ---------- Spotlight + tilt ---------- */
  if (fine) {
    $$('.tile,.wcard').forEach(el => el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--sx', x + 'px'); el.style.setProperty('--sy', y + 'px');
      if (el.classList.contains('wcard') && !reduce) {
        el.style.setProperty('--ry', ((x / r.width - .5) * 8).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((.5 - y / r.height) * 8).toFixed(2) + 'deg');
      }
    }));
    $$('.wcard').forEach(el => el.addEventListener('mouseleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }));
  }

  /* ---------- Bento mini-demos ---------- */
  const typeInto = async (el, text, speed = 45) => {
    el.textContent = '';
    for (const ch of text) { el.textContent += ch; await new Promise(r => setTimeout(r, reduce ? 0 : speed)); }
  };
  const sleep = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const whenVisible = (el, fn) => {
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { threshold: .3 });
    o.observe(el);
  };
  const sq = $('[data-search-demo]');
  whenVisible(sq, async () => {
    const q = $('.q', sq), ans = $('.ai-answer', sq);
    const queries = JSON.parse(sq.dataset.searchDemo);
    for (let i = 0; ; i = (i + 1) % queries.length) {
      ans.classList.remove('show'); await sleep(500);
      await typeInto(q, queries[i].q, 42); await sleep(500);
      $('.a', ans).textContent = queries[i].a; ans.classList.add('show');
      await sleep(4200);
      if (reduce) break;
    }
  });
  const flow = $('[data-flow]');
  whenVisible(flow, () => {
    const nodes = $$('.flow-node', flow); let i = 0;
    const go = () => { nodes.forEach((n, k) => n.classList.toggle('active', k === i)); i = (i + 1) % nodes.length; };
    go(); if (!reduce) setInterval(go, 1100);
  });
  const typed = $('[data-typed]');
  whenVisible(typed, async () => {
    const lines = JSON.parse(typed.dataset.typed), out = $('.out', typed);
    for (let i = 0; ; i = (i + 1) % lines.length) {
      await typeInto(out, lines[i], 38); await sleep(2200);
      if (reduce) break;
      while (out.textContent.length) { out.textContent = out.textContent.slice(0, -1); await sleep(16); }
      await sleep(300);
    }
  });
  const fz = $('[data-favze]');
  if (fz) {
    const btns = $$('button', fz), detail = $('.favze-detail');
    const show = b => {
      btns.forEach(x => x.classList.toggle('on', x === b)); btns.forEach(x => x.setAttribute('aria-pressed', x === b));
      detail.innerHTML = `<b>${b.dataset.name}</b>${b.dataset.desc}`;
    };
    btns.forEach(b => { b.addEventListener('mouseenter', () => show(b)); b.addEventListener('focus', () => show(b)); b.addEventListener('click', () => show(b)); });
    show(btns[0]);
  }

  /* ---------- Generic filter + search (skills, certifications) ---------- */
  $$('[data-explorer]').forEach(ex => {
    const items = $$('[data-cat]', ex), input = $('input[type="search"]', ex), count = $('.count', ex);
    const btns = $$('[data-filter]', ex), empty = $('.empty', ex);
    const mode = ex.dataset.explorer; // "dim" keeps all visible and dims; "hide" filters out
    let cat = 'all', expanded = false;
    const cloud = $('.cloud', ex), more = $('.cloud-more', ex);
    more && $('button', more).addEventListener('click', () => { expanded = true; apply(); });
    const apply = () => {
      const q = (input && input.value.trim().toLowerCase()) || '';
      let n = 0;
      items.forEach(it => {
        const inCat = cat === 'all' || it.dataset.cat.split('|').includes(cat);
        const inQ = !q || it.textContent.toLowerCase().includes(q) || (it.dataset.k || '').toLowerCase().includes(q);
        const ok = inCat && inQ; if (ok) n++;
        if (mode === 'dim') { it.hidden = !inCat; it.classList.toggle('dim', !!q && !inQ); it.classList.toggle('hit', !!q && inQ && inCat); }
        else it.hidden = !ok;
      });
      if (count) count.textContent = `${n} of ${items.length}`;
      if (cloud) { const open = expanded || !!q || cat !== 'all'; cloud.classList.toggle('clamped', !open); more && (more.hidden = open); }
      if (empty) empty.hidden = n > 0;
    };
    btns.forEach(b => b.addEventListener('click', () => {
      const same = cat === b.dataset.filter && b.dataset.filter !== 'all';
      cat = same ? 'all' : b.dataset.filter;
      btns.forEach(x => x.setAttribute('aria-pressed', x.dataset.filter === cat));
      apply();
    }));
    input && input.addEventListener('input', apply);
    const pq = new URLSearchParams(location.search).get('q');
    if (pq && input) input.value = pq;
    apply();
  });

  /* ---------- Confetti + easter egg ---------- */
  function burst(origin, n = 24, chars = ['✦', '●', '✦', '▲', '■']) {
    const hues = ['#3971B8', '#C8D69B', '#111111'];
    if (reduce) return;
    const r = origin.getBoundingClientRect ? origin.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span'); s.className = 'confetti'; s.textContent = chars[i % chars.length]; s.style.color = hues[i % hues.length];
      s.setAttribute('aria-hidden', 'true');
      document.body.append(s);
      const x0 = r.left + r.width / 2, y0 = r.top + r.height / 2, ang = Math.random() * Math.PI * 2, v = 120 + Math.random() * 260;
      s.animate([
        { transform: `translate(${x0}px,${y0}px) scale(.4) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x0 + Math.cos(ang) * v}px,${y0 + Math.sin(ang) * v - 80}px) scale(1) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(${x0 + Math.cos(ang) * v * 1.2}px,${y0 + Math.sin(ang) * v + 160}px) scale(.8) rotate(${Math.random() * 540}deg)`, opacity: 0 }
      ], { duration: 1400 + Math.random() * 700, easing: 'cubic-bezier(.22,1,.36,1)' }).onfinish = () => s.remove();
    }
  }
  const toast = $('.toast');
  const say = msg => { if (!toast) return; toast.innerHTML = msg; toast.classList.add('show'); clearTimeout(say.t); say.t = setTimeout(() => toast.classList.remove('show'), 3800); };
  let buf = '';
  addEventListener('keydown', e => {
    if (e.target.matches('input,textarea')) return;
    buf = (buf + e.key.toLowerCase()).slice(-5);
    if (buf === 'favze') {
      burst({ getBoundingClientRect: () => ({ left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 }) }, 60);
      say('<span aria-hidden="true">✦</span> You found the secret. Let’s make your brand the favorite.');
    }
  });
  $$('[data-burst]').forEach(b => b.addEventListener('click', () => burst(b, 26)));
  $$('[data-egg]').forEach(b => b.addEventListener('click', () => {
    if (fine) { b.blur(); say('<span aria-hidden="true">⌨️</span> Go ahead: type <b>f a v z e</b> on your keyboard.'); }
    else { burst(b, 60); say('<span aria-hidden="true">✦</span> You found the secret. Let’s make your brand the favorite.'); }
  }));
  console.log('%cHey, fellow curious mind. 👋', 'font:700 16px sans-serif;color:#3971B8');
  console.log('%cHand-built by Riley Catalano. Type “favze” anywhere on the page for a surprise.', 'font:13px sans-serif;color:#626879');

  /* ---------- Opening book ---------- */
  $$('.book-btn').forEach(btn => {
    const book = $('.book', btn);
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-pressed') !== 'true';
      btn.setAttribute('aria-pressed', open);
      btn.dataset.cursor = open ? 'Close' : 'Open';
      btn.setAttribute('aria-label', open ? 'Close Purple Cow' : 'Open Purple Cow by Seth Godin to read my margin note');
      book.style.setProperty('--tx', '0deg'); book.style.setProperty('--ty', '0deg');
      if (open && !reduce) setTimeout(() => burst($('.note-sig', btn), 10), 1100);
    });
    if (!reduce && matchMedia('(pointer:fine)').matches) {
      btn.addEventListener('pointermove', e => {
        if (btn.getAttribute('aria-pressed') === 'true') return;
        const r = btn.getBoundingClientRect();
        book.style.setProperty('--ty', ((e.clientX - r.left) / r.width - .5) * 22 + 'deg');
        book.style.setProperty('--tx', ((e.clientY - r.top) / r.height - .5) * -14 + 'deg');
      });
      btn.addEventListener('pointerleave', () => { book.style.setProperty('--tx', '0deg'); book.style.setProperty('--ty', '0deg'); });
    }
  });

  /* ---------- Experience timeline: scroll-drawn spine + lit nodes ---------- */
  const tl = $('[data-xp]');
  if (tl) {
    const items = $$('.xp-item', tl);
    const tick = () => {
      const r = tl.getBoundingClientRect(), mid = innerHeight * .55;
      tl.style.setProperty('--p', clamp((mid - r.top) / r.height, 0, 1).toFixed(3));
      items.forEach(it => it.classList.toggle('is-lit', it.getBoundingClientRect().top + 20 < mid));
    };
    if (reduce) items.forEach(it => it.classList.add('is-lit'));
    else { addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick(); }
  }

  /* ---------- Website builder demo (wireframe -> design -> launch) ---------- */
  $$('[data-builder]').forEach(el => {
    const bw = $('.bw', el), btns = $$('[data-stage]', el), cap = $('.builder-cap', el);
    const caps = ['Wireframe: map every page around one clear next step.', 'Design: your brand, your copy, mobile-first.', 'Launch: fast, found, and capturing leads.'];
    let stage = 0, timer = 0, auto = !reduce;
    const show = n => {
      stage = n; bw.dataset.stage = n;
      btns.forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.stage === n)));
      cap.textContent = caps[n];
    };
    const loop = () => { clearTimeout(timer); if (!auto) return; timer = setTimeout(() => { show((stage + 1) % 3); loop(); }, stage === 2 ? 5200 : 3200); };
    btns.forEach(b => b.addEventListener('click', () => { auto = false; clearTimeout(timer); show(+b.dataset.stage); }));
    show(reduce ? 2 : 0);
    new IntersectionObserver(([e]) => { if (e.isIntersecting && auto) loop(); else clearTimeout(timer); }).observe(el);
  });

  /* ---------- Variable font playground ---------- */
  const pg = $('#pg-text');
  if (pg) {
    const w = $('#pg-w'), s = $('#pg-s'), wv = $('#pg-wv'), sv = $('#pg-sv');
    const set = (wt, st) => {
      pg.style.setProperty('--w', Math.round(wt)); pg.style.setProperty('--s', Math.round(st));
      w.value = wt; s.value = st; wv.textContent = Math.round(wt); sv.textContent = Math.round(st) + '%';
    };
    w.addEventListener('input', () => set(+w.value, +s.value));
    s.addEventListener('input', () => set(+w.value, +s.value));
    let dancing = 0;
    $('#pg-dance').addEventListener('click', () => {
      if (reduce) { set(900, s.value < 100 ? 140 : 62); return; }
      cancelAnimationFrame(dancing);
      const t0 = performance.now();
      const step = t => {
        const k = (t - t0) / 1000;
        set(500 + 400 * Math.sin(k * 2.2), 100 + 50 * Math.sin(k * 1.6 + 1));
        if (k < 4) dancing = requestAnimationFrame(step); else set(900, 62);
      };
      dancing = requestAnimationFrame(step);
    });
  }

  /* ---------- Tabs (schema explorer) ---------- */
  $$('[role="tablist"]').forEach(list => {
    const tabs = $$('[role="tab"]', list);
    const pick = tab => tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => pick(t));
      t.addEventListener('keydown', e => {
        const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return; e.preventDefault();
        const n = tabs[(i + d + tabs.length) % tabs.length]; pick(n); n.focus();
      });
    });
  });

  /* ---------- Legal contents rail ---------- */
  const toc = $$('.legal-toc a');
  if (toc.length) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) toc.forEach(a => a.classList.toggle('is-active', a.hash === '#' + e.target.id));
    }), { rootMargin: '-20% 0px -70% 0px' });
    $$('.legal-prose h2[id]').forEach(h => io.observe(h));
  }

  /* ---------- Motion toggle ---------- */
  const legal = $('.footer-legal > span:last-child');
  if (legal) {
    const off = document.documentElement.classList.contains('rm');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'motion-toggle';
    b.setAttribute('aria-pressed', String(!off));
    b.innerHTML = `<i aria-hidden="true"></i>Motion ${off ? 'off' : 'on'}`;
    b.addEventListener('click', () => {
      try { off ? localStorage.removeItem('rc-motion') : localStorage.setItem('rc-motion', 'off'); } catch (e) {}
      location.reload();
    });
    legal.prepend(b);
  }

  /* ---------- Year ---------- */
  $$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
