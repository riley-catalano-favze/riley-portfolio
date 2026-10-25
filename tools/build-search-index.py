"""Build assets/search-index.json for the site-wide search.

Run from the repo root after editing any page:  python3 tools/build-search-index.py
"""
import json, re, pathlib
from urllib.parse import quote
from bs4 import BeautifulSoup

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ['index', 'website-design', 'search-visibility', 'email-marketing', 'copywriting',
         'social-media-marketing', 'certifications', 'bookshelf', 'how-its-built',
         'privacy-policy', 'terms-of-use']

def url(page, anchor='', q=''):
    path = '/' if page == 'index' else '/' + page
    if q:
        path += ('' if path.endswith('/') else '') + '?q=' + quote(q)
    return path + (('#' + anchor) if anchor else '')

def clean(t):
    return re.sub(r'\s+([,.;:!?])', r'\1', re.sub(r'\s+', ' ', t or '')).strip()

items, seen = [], set()
def add(kind, title, sub, link, text=''):
    key = (kind, title.lower(), link)
    if not title or key in seen:
        return
    seen.add(key)
    items.append({'k': kind, 't': title, 's': sub, 'u': link, 'x': clean(text)[:220]})

for page in PAGES:
    soup = BeautifulSoup((ROOT / f'{page}.html').read_text(), 'html.parser')
    for s in soup.select('.sr-only'):
        s.decompose()
    parts = [x.strip() for x in re.split(r'[|]', clean(soup.title.get_text()))]
    ptitle = next((x for x in parts if 'Riley Catalano' not in x), parts[0])
    ptitle = re.sub(r'^(Riley Catalano)\s*[-:]\s*', '', ptitle)
    desc = soup.find('meta', attrs={'name': 'description'})
    add('Page', 'Home' if page == 'index' else ptitle, 'rileycatalano.com', url(page), desc['content'] if desc else '')

    # section headings
    for h in soup.select('main h2, section h2'):
        txt = clean(h.get_text(' '))
        if not txt or len(txt) > 90:
            continue
        sec = h.find_parent('section')
        anchor = h.get('id') or (sec.get('id') if sec else '') or ''
        lead = ''
        if sec:
            p = sec.select_one('.lead, p')
            lead = p.get_text(' ') if p else ''
        add('Section', txt.title() if txt.isupper() else txt, ptitle if page != 'index' else 'Home', url(page, anchor), lead)

    # FAQ questions (homepage + service pages)
    for qa in soup.select('details.qa, .faq-item'):
        q = qa.select_one('summary, .faq-q')
        a = qa.select_one('.ans, .faq-a')
        if q:
            add('FAQ', clean(q.get_text(' ')), ptitle if page != 'index' else 'Home', url(page, 'faq' if soup.find(id='faq') else ''), a.get_text(' ') if a else '')

    if page == 'index':
        # Experience timeline + grouped responsibilities
        for row in soup.select('.pt-row[id]'):
            h3 = row.select_one('h3'); co = row.select_one('.pt-co'); it = row.select_one('.pt-it'); meta = row.select_one('.pt-meta')
            if not h3:
                continue
            title = clean(h3.get_text())
            add('Experience', title, clean(co.get_text()) if co else '', url(page, row['id']),
                ' '.join(clean(x.get_text()) for x in (it, meta) if x))
            body = row.select_one('.pt-more-body')
            if body:
                heading = ''
                for el in body.children:
                    if getattr(el, 'name', None) == 'h4':
                        heading = clean(el.get_text())
                    elif getattr(el, 'name', None) == 'ul':
                        for li in el.select('li'):
                            t = clean(li.get_text(' '))
                            short = t if len(t) < 90 else t[:87].rsplit(' ', 1)[0] + '…'
                            add('Responsibility', short, f'{title} · {heading}', url(page, row['id']), t)
        # Skills
        for sp in soup.select('.cloud span[data-cat]'):
            t = clean(sp.get_text())
            add('Skill', t, sp['data-cat'].split('|')[0], url(page, 'skills', q=t))
        # Selected work cards
        for card in soup.select('.wcard'):
            h = card.select_one('h3'); p = card.select_one('p')
            if h:
                add('Work', clean(h.get_text()), 'Selected work', url(page, 'work'), p.get_text(' ') if p else '')

    if page == 'certifications':
        for c in soup.select('article.cert'):
            h = c.select_one('h3'); iss = c.select_one('.iss')
            if h:
                t = clean(h.get_text())
                add('Credential', t, clean(iss.get_text()) if iss else 'Certification', url(page, 'all', q=t))

    if page == 'bookshelf':
        for t, a in [('Purple Cow', 'Seth Godin'), ('Building a StoryBrand 2.0', 'Donald Miller'), ('All Marketers Are Liars', 'Seth Godin')]:
            add('Book', t, a, url(page))
        for m in soup.select('.mind'):
            h = m.select_one('h3'); k = m.select_one('.kind'); p = m.select_one('p')
            if h:
                add('Inspiration', clean(h.get_text()), clean(k.get_text()) if k else '', url(page), p.get_text(' ') if p else '')

    if page == 'website-design':
        for b in soup.select('.wd-build'):
            h = b.select_one('h3'); p = b.select_one('p')
            if h:
                add('Work', clean(h.get_text()), 'Website build', url(page, 'builds'), p.get_text(' ') if p else '')

out = ROOT / 'assets' / 'search-index.json'
out.write_text(json.dumps(items, ensure_ascii=False, separators=(',', ':')))
from collections import Counter
print(len(items), 'items', dict(Counter(i['k'] for i in items)), out.stat().st_size, 'bytes')
