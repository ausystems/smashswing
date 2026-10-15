#!/usr/bin/env python3
"""Assemble the static pages: src/pages/*.html bodies + shared partials → site root."""
import os, re
BASE = os.environ.get('SITE_BASE', '/').rstrip('/') + '/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
partials = {n: open(P('src', 'partials', f'{n}.html')).read() for n in ['nav', 'footer', 'cta', 'icons']}
CAL = 'https://calendly.com/tj-smashswing/30min'   # TJ's booking calendar: every "Book a demo"

PAGES = {
    'home':         ('index.html',              'SmashSwing | Multi-Player Golf Simulator and Indoor Range', 'SmashSwing is a multi-player golf simulator and indoor range. Golfers hit at the same time on one big screen, and every ball is tracked.'),
    'products':     ('products/index.html',     'Products | SmashSwing Multiplayer Simulator, Indoor Range and Practice Campus', 'Three ways to use SmashSwing: a 2–6 player multiplayer simulator, an indoor range for 12–24 players, or the center of a practice campus.'),
    'technology':   ('technology/index.html',   'Technology | SmashSwing Point of Contact and Multi-Ball Tracking', 'SmashSwing tracks every ball on one screen. In golf mode you see the ball flight. In our games, the action happens where the ball hits the screen.'),
    'press':        ('press/index.html',        'Press | SmashSwing News, Videos and Articles', 'SmashSwing press releases, videos of founder TJ Schier and articles.'),
    'contact':      ('contact/index.html',      'Book a SmashSwing Demo', 'Book a 30-minute remote demo with SmashSwing founder TJ Schier.'),
    'consultation': ('consultation/index.html', 'Consultation | SmashSwing', 'Book a consult call with TJ Schier about golf entertainment, indoor ranges and competitive socializing venues.'),
}
NO_CTA = {'consultation'}
# closing band: the homepage ends with the "Hit! Don't Sit!" gallery, so its band asks for the demo
CTA_TITLE = {'home': 'Book a <em>demo.</em>'}
CTA_TITLE_DEFAULT = 'Hit. <em>Don’t sit.</em>'
CTA_LEAD = {}
CTA_LEAD_DEFAULT = 'See SmashSwing for yourself. Pick a time on TJ’s calendar.'
REDIRECTS = {'case-studies': '../press/'}   # old URL keeps working
HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#000000">
  <link rel="icon" href="/brand/logomark-color.svg" type="image/svg+xml">
  <link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/src/styles/reset.css">
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/base.css">
  <link rel="stylesheet" href="/src/styles/pages.css">
  <link rel="stylesheet" href="/src/styles/home.css">
  <link rel="stylesheet" href="/src/styles/consult.css">
  <link rel="stylesheet" href="/src/styles/additions.css">
</head>
<body data-page="{page}">
'''
DIALOG = '''
<dialog class="s-dialog" id="video-dialog" aria-label="Video">
  <button class="s-dialog__close" type="button" aria-label="Close the video" data-close-dialog><span></span><span></span></button>
  <div class="s-dialog__frame"></div>
  <p class="s-dialog__title"></p>
</dialog>
'''
TAIL = '''
<script type="module" src="/src/main.js"></script>
</body>
</html>
'''
for page, (out, title, desc) in PAGES.items():
    body = open(P('src', 'pages', f'{page}.html')).read()
    nav = re.sub(r'\{\{active:([\w-]+)\}\}', lambda m: ' aria-current="page"' if m.group(1) == page else '', partials['nav'])
    assert '{{cta_lead}}' in partials['cta'], 'cta partial lost its placeholder'
    cta = partials['cta'].replace('{{cta_lead}}', CTA_LEAD.get(page, CTA_LEAD_DEFAULT)).replace('{{cta_title}}', CTA_TITLE.get(page, CTA_TITLE_DEFAULT))
    body = re.sub(r'<!--#include ([\w-]+)-->', lambda m: open(P('src', 'partials', 'blocks', f'{m.group(1)}.html')).read(), body)
    head = HEAD.format(title=title, desc=desc, page=page)
    if page == 'home':
        head = head.replace('  <link rel="stylesheet" href="/src/styles/reset.css">', '  <link rel="preload" href="/img/photos/gunswinger-wide.webp" as="image" fetchpriority="high">\n  <link rel="stylesheet" href="/src/styles/reset.css">', 1)
    html = head + partials['icons'] + nav + '\n<main id="main">\n' + body + '\n</main>\n' + (cta if page not in NO_CTA else '') + partials['footer'] + DIALOG + TAIL
    html = html.replace('{{CAL}}', CAL)
    assert '{{' not in html, f'unfilled placeholder in {page}'
    # internal links get the deploy base (GitHub Pages serves the site under /smashswing/)
    html = re.sub(r'href="/(?=(products|technology|press|consultation|contact|privacy|terms|accessibility)/|docs/|"|#)', f'href="{BASE}', html)
    os.makedirs(os.path.dirname(P(out)) or ROOT, exist_ok=True)
    open(P(out), 'w').write(html)
    print('wrote', out)

for old, target in REDIRECTS.items():
    d = P('public', old); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url={target}"><link rel="canonical" href="{target}"></head><body><p>This page moved. <a href="{target}">Go to the new page</a>.</p></body></html>\n')
    print('redirect', old, '->', target)
