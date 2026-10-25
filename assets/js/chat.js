/* =========================================================
   Text Riley: an iMessage-style chat that answers the most
   common questions instantly, scripted from Riley's own FAQ.
   ========================================================= */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.classList.contains('rm');
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const BOOK = 'https://favze.com/free-consultation';
  const LI = 'https://www.linkedin.com/in/rileycatalano/';

  // Each topic: keywords to match, the reply bubbles, and follow-up chips.
  const T = {
    hi: {
      k: ['hi', 'hello', 'hey', 'yo', 'sup', 'howdy'],
      a: ['Hey! 👋 So glad you stopped by.', 'Ask me anything about my work, results, or how I can help your business grow.'],
      next: ['what', 'results', 'book']
    },
    what: {
      q: 'What do you do?',
      k: ['what do you do', 'full-stack', 'full stack', 'do you do', 'specialty', 'speciali', 'services', 'help', 'offer', 'who are you', 'about you'],
      a: ['I build complete lead generation systems, start to finish. 🔁',
          'Search visibility gets a business found, a website built to convert earns the lead, CRM and email automation move it through the pipeline, and copywriting and social keep the brand consistent everywhere.',
          'One person, one connected system, from first search to closed lead.'],
      links: [['Search Visibility', '/search-visibility'], ['Email Marketing', '/email-marketing'], ['Copywriting', '/copywriting'], ['Social Media', '/social-media-marketing'], ['Website Design', '/website-design']],
      next: ['web', 'results', 'book']
    },
    results: {
      q: 'What results have you driven?',
      k: ['result', 'proof', 'numbers', 'review', 'rating', 'stars', 'impact', 'roi', 'win', 'case stud'],
      a: ['My favorite one: ABI Attachments had lost the emails behind years of reviews, so I tracked customers down and asked them to post on the new platform. ⭐',
          'Two weeks and a couple hours of work later, reviews grew from 52 to 71 and the rating climbed from 3.6 to 3.9 stars.',
          'I also rewrote a Google Business Profile description that hit first-page rankings for its branded term within one hour, and wrote alt text for 2,300 images.'],
      next: ['groundbreakers', 'hire', 'book']
    },
    favze: {
      q: 'What is the FAVZE Framework?',
      k: ['favze', 'framework', 'agency', 'company', 'business you own', 'method', 'process', 'system'],
      a: ['The FAVZE Framework is my five-stage, closed-loop lead generation system:',
          '<b>F</b>indability · <b>A</b>udience · <b>V</b>elocity · <b>Z</b>ippy Workflows · <b>E</b>vergreen',
          'It runs through every service at Favze Digital Marketing, the agency I founded in Middlebury to help local businesses across Northern Indiana and Michiana grow, with transparent pricing every step of the way.'],
      links: [['Explore the framework', 'https://favze.com/favze-framework'], ['Visit Favze', 'https://favze.com']],
      next: ['story', 'results', 'book']
    },
    story: {
      q: "What's your story?",
      k: ['story', 'background', 'age', 'old', 'start', 'began', 'journey', 'high school', 'graduat', 'dental', 'career'],
      a: ['I founded Favze in October 2025, during my junior year of high school, and that junior year became my final year. 🎓',
          'I joined ABI Attachments as a Marketing Intern in January 2026, then earned two promotions in seven months, to Email Automation Specialist and then Digital Marketing Specialist.',
          'Now I am earning a bachelor’s and a master’s at WGU in about 18 months.'],
      links: [['Scroll the full story', '/#story']],
      next: ['creds', 'what', 'book']
    },
    creds: {
      q: 'What credentials do you have?',
      k: ['cert', 'credential', 'degree', 'wgu', 'college', 'school', 'education', 'award', 'qualif', 'learn'],
      a: ['138 certifications across Google, HubSpot, Semrush, BrightEdge, LinkedIn Learning, and more. 📜',
          'I am working toward a bachelor’s and master’s at Western Governors University, where I earned an Excellence Award in Critical Thinking: Reason and Evidence.'],
      links: [['Search every credential', '/certifications']],
      next: ['learning', 'hire', 'book']
    },
    hire: {
      q: 'Why should I hire you?',
      k: ['hire', 'why you', 'choose', 'different', 'better', 'work with', 'job', 'employ', 'resume', 'recruit'],
      a: ['You get one person who builds the strategy and executes it, focused on real visibility and measurable growth. 💪',
          'My clients notice the speed too. Katherine Clark, RN, told me I do it “so fast and with perfection.”'],
      links: [['Read her messages', '/#proof']],
      next: ['book', 'results', 'what']
    },
    book: {
      q: 'Can we book a call?',
      k: ['book', 'call', 'meet', 'talk', 'schedule', 'contact', 'email', 'reach', 'price', 'pricing', 'cost', 'quote', 'consult', 'hire you now'],
      a: ['Yes! I would love that. 📅', 'Book a free strategy call through Favze and we will map where your leads come from today and the system that brings in more.'],
      links: [['Book a free strategy call', BOOK], ['Connect on LinkedIn', LI]],
      next: ['what', 'favze']
    },
    groundbreakers: {
      q: 'Proudest campaign?',
      k: ['groundbreakers', 'proud', 'campaign', 'ugc', 'user-generated', 'user generated', 'favorite campaign'],
      a: ['Groundbreakers! 🚜 I pitched it to ABI Attachments as a user-generated content program that motivates customers to create how-to videos, reviews, and jobsite content with their equipment.',
          'Real customer stories build trust and strengthen search and AI visibility at the same time. It is live now, and watching it grow is a blast.'],
      next: ['results', 'hire', 'book']
    },
    books: {
      q: 'Favorite marketing book?',
      k: ['book', 'read', 'purple cow', 'godin', 'podcast', 'youtube', 'inspir', 'marketer', 'neil', 'wes', 'mentor', 'favorite'],
      a: ['Purple Cow by Seth Godin. 🐄 It introduced me to marketing and shaped how I think about standing out.',
          'On repeat: the Marketing School podcast, Grow My Ads on YouTube, and the work of Neil Patel and Wes McDowell.'],
      links: [['Browse my bookshelf', '/bookshelf']],
      next: ['learning', 'story']
    },
    learning: {
      q: 'What are you learning now?',
      k: ['learning', 'growing', 'next', 'improv', 'studying', 'goal', 'future'],
      a: ['Strategic category creation and coding in GitHub, plus sharpening WordPress and public relations so every release reaches further. 🌱'],
      next: ['site', 'creds']
    },
    site: {
      q: 'How did you build this site?',
      k: ['site', 'website', 'portfolio', 'built', 'code', 'github', 'design', 'html', 'animation', 'chat', 'bot'],
      a: ['I hand-built it in HTML, CSS, and JavaScript and host it on GitHub. 💻',
          'Every page carries structured data so Google and AI answer engines understand exactly who I am. This chat runs on my own FAQ, so every answer is mine.'],
      links: [['See how it was built', '/how-its-built']],
      next: ['learning', 'book']
    },
    web: {
      q: 'Do you design websites?',
      k: ['website design', 'web design', 'design a website', 'build a website', 'build my website', 'new website', 'redesign', 'landing page', 'webpage', 'web page', 'developer', 'wordpress', 'hubspot site'],
      a: ['Yes! 🖥️ I design and hand-code websites built to get found, earn trust fast, and turn visitors into leads.',
          'I have built this site, the Favze website, and the Belle Allure Aesthetics and Wellness website, plus a custom CRM and client portal.',
          'Every site plugs into the rest of the system: search, CRM, email, and social.'],
      links: [['See my website design work', '/website-design'], ['Book a free strategy call', BOOK]],
      next: ['site', 'results', 'book']
    },
    ai: {
      k: ['chatgpt', 'perplexity', 'gemini', 'claude', 'geo', 'aeo', 'seo', 'search', 'google', 'rank'],
      a: ['Search is my home turf. 🔎 I build visibility across traditional SEO, Answer Engine Optimization, Generative Engine Optimization, Local SEO, and AI Optimization.',
          'I also monitor how ChatGPT, Perplexity, Gemini, Claude, and Google AI Overviews describe the brands I work with, then tune the content so those answers stay accurate.'],
      links: [['Search Visibility work', '/search-visibility']],
      next: ['results', 'book']
    }
  };
  const START = ['what', 'web', 'results', 'favze', 'hire', 'book'];
  const FALLBACK = {
    a: ['Great question! That one deserves a real conversation. ✨', 'Book a quick call or message me on LinkedIn and I will answer it personally.'],
    links: [['Book a free strategy call', BOOK], ['Message me on LinkedIn', LI]],
    next: ['what', 'results', 'story']
  };

  const match = text => {
    const t = ' ' + text.toLowerCase().replace(/[^\w\s'-]/g, ' ') + ' ';
    let best = null, score = 0;
    for (const [id, topic] of Object.entries(T)) {
      let s = 0;
      for (const k of topic.k) if (t.includes(k.length < 4 ? ' ' + k + ' ' : k)) s += k.length;
      if (s > score) { score = s; best = id; }
    }
    return best;
  };

  /* ---------- Markup ---------- */
  const root = document.createElement('div');
  root.className = 'tr';
  root.innerHTML = `
    <button class="tr-fab" type="button" aria-expanded="false" aria-controls="tr-panel" data-cursor="Text">
      <span class="tr-av" aria-hidden="true">RC<i></i></span>
      <span class="tr-label">Text Riley</span>
      <span class="tr-badge" aria-hidden="true">1</span>
    </button>
    <div class="tr-peek" aria-hidden="true">Hey! 👋 Got a question? Text me.</div>
    <section class="tr-panel" id="tr-panel" role="dialog" aria-modal="false" aria-labelledby="tr-name" hidden>
      <header class="tr-head">
        <button class="tr-close" type="button" aria-label="Close chat"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        <span class="tr-av big" aria-hidden="true">RC<i></i></span>
        <b id="tr-name">Riley Catalano</b>
        <small>Instant answers from my FAQ</small>
      </header>
      <ol class="tr-log" data-lenis-prevent aria-live="polite" aria-label="Conversation"></ol>
      <div class="tr-chips" data-lenis-prevent role="group" aria-label="Suggested questions"></div>
      <form class="tr-form" autocomplete="off">
        <label class="sr-only" for="tr-input">Message Riley</label>
        <input id="tr-input" type="text" placeholder="iMessage" maxlength="160">
        <button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
      </form>
    </section>`;
  document.body.appendChild(root);

  const fab = root.querySelector('.tr-fab'), panel = root.querySelector('.tr-panel');
  const log = root.querySelector('.tr-log'), chips = root.querySelector('.tr-chips');
  const form = root.querySelector('.tr-form'), input = root.querySelector('#tr-input');
  const peek = root.querySelector('.tr-peek');
  let started = false, busy = false;

  const scroll = () => log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });

  const bubble = (html, who = 'them', extra = '') => {
    const li = document.createElement('li');
    li.className = `tr-b ${who} ${extra}`.trim();
    li.innerHTML = html;
    log.appendChild(li);
    requestAnimationFrame(() => li.classList.add('in'));
    scroll();
    return li;
  };

  const typing = async ms => {
    const li = bubble('<i></i><i></i><i></i>', 'them', 'typing');
    li.setAttribute('aria-hidden', 'true');
    await wait(ms);
    li.remove();
  };

  const setChips = ids => {
    chips.innerHTML = '';
    ids.filter(id => T[id] && T[id].q).forEach((id, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.textContent = T[id].q; b.style.setProperty('--i', i);
      b.addEventListener('click', () => ask(T[id].q, id));
      chips.appendChild(b);
    });
  };

  const reply = async topic => {
    busy = true; chips.classList.add('is-busy');
    for (const line of topic.a) {
      await typing(Math.min(1400, 450 + line.length * 9));
      const li = bubble(line);
      if (line === topic.a[topic.a.length - 1]) li.classList.add('tail');
    }
    if (topic.links) {
      await wait(250);
      const html = topic.links.map(([t, h]) => `<a href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${t} <span aria-hidden="true">↗</span></a>`).join('');
      bubble(html, 'them', 'links');
    }
    setChips(topic.next || START);
    busy = false; chips.classList.remove('is-busy');
  };

  const ask = async (text, id) => {
    if (busy || !text.trim()) return;
    const me = bubble(text.replace(/[<>&]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c])), 'me', 'tail');
    chips.innerHTML = '';
    await wait(350);
    me.insertAdjacentHTML('beforeend', '<span class="tr-read" aria-hidden="true">Read</span>');
    await wait(250);
    const key = id || match(text);
    await reply(key ? T[key] : FALLBACK);
  };

  const open = async () => {
    panel.hidden = false;
    requestAnimationFrame(() => root.classList.add('is-open'));
    fab.setAttribute('aria-expanded', 'true');
    root.classList.add('seen');
    if (matchMedia('(pointer:fine)').matches) setTimeout(() => input.focus(), 250);
    if (!started) {
      started = true;
      await wait(350);
      await reply({ a: ['Hey, I’m Riley! 👋', 'Founder of Favze Digital Marketing and a full-stack lead generation marketer. Ask me anything, or tap a question below.'], next: START });
    }
  };
  const close = () => {
    root.classList.remove('is-open');
    fab.setAttribute('aria-expanded', 'false');
    setTimeout(() => { if (!root.classList.contains('is-open')) panel.hidden = true; }, reduce ? 0 : 350);
    fab.focus();
  };

  fab.addEventListener('click', () => (root.classList.contains('is-open') ? close() : open()));
  root.querySelector('.tr-close').addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value; input.value = ''; ask(v); });

  // Double-tap any of Riley's bubbles to heart it, just like iMessage
  log.addEventListener('dblclick', e => {
    const b = e.target.closest('.tr-b.them:not(.typing)');
    if (!b || b.querySelector('.tr-heart')) return;
    getSelection().removeAllRanges();
    b.insertAdjacentHTML('beforeend', '<span class="tr-heart" aria-hidden="true">❤️</span>');
  });

  // Any link on the page can open the chat: <a href="#text-riley"> or [data-text-riley]
  document.addEventListener('click', e => {
    const t = e.target.closest('[href="#text-riley"],[data-text-riley]');
    if (!t) return;
    e.preventDefault(); open();
    if (t.dataset.textRiley) setTimeout(() => ask(T[t.dataset.textRiley] ? T[t.dataset.textRiley].q : t.dataset.textRiley, T[t.dataset.textRiley] ? t.dataset.textRiley : null), 1600);
  });

  // A friendly nudge after a little reading time
  setTimeout(() => { if (!started) root.classList.add('peeking'); }, 9000);
  setTimeout(() => root.classList.remove('peeking'), 16000);
})();
