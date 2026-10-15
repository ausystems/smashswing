#!/usr/bin/env python3
"""Assemble the static pages: src/pages/*.html bodies + shared partials → site root.

Placeholders:
  {{active:slug}}      nav highlight for the current page
  {{CAL}}              TJ's booking calendar (every "Book a demo")
  {{cta_lead}}         closing band line
  <!--#include name--> shared block from src/partials/blocks/name.html
"""
import os, re
BASE = os.environ.get('SITE_BASE', '/').rstrip('/') + '/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
partials = {n: open(P('src', 'partials', f'{n}.html')).read() for n in ['nav', 'footer', 'cta', 'icons']}
CAL = 'https://calendly.com/tj-smashswing/30min'

PAGES = {
    'home':                ('index.html', 'SmashSwing | Multi-Player Golf Simulator and Indoor Range',
                            'SmashSwing is a multi-player golf simulator and indoor range. Golfers hit at the same time on one big screen, and every ball is tracked. Book a demo.'),
    'what-is-smashswing':  ('what-is-smashswing/index.html', 'What Is SmashSwing? | Multi-Player Golf Simulator',
                            'SmashSwing is a multi-player golf simulator and indoor range. See the system, what makes it different, the 3 ways to play and the sizes.'),
    'vs-traditional-sims': ('vs-traditional-sims/index.html', 'SmashSwing vs. Traditional Golf Simulators',
                            'A traditional golf simulator is one player at a time. SmashSwing lets the whole group play. See the difference and the 3 problems it solves for golf operators.'),
    'technology':          ('technology/index.html', 'SmashSwing Technology | Point of Contact and Multi-Ball Tracking',
                            'SmashSwing tracks many golf balls at once on one screen. In our games, the action happens right where each ball hits the screen.'),
    'who-its-for':         ('who-its-for/index.html', 'Who SmashSwing Is For | Golf Courses, Clubs, Ranges and Venues',
                            'SmashSwing fits golf courses, country clubs, driving ranges, simulator venues, resorts, restaurants and entertainment venues. See the setups and sizes.'),
    'press':               ('press/index.html', 'SmashSwing Press | News, Videos and Articles',
                            'SmashSwing news releases, videos, podcasts and articles from founder TJ Schier.'),
    'consultation':        ('consultation/index.html', 'Consulting with TJ Schier | SmashSwing',
                            'Book a consult call with TJ Schier about golf entertainment venues, indoor ranges and practice campuses.'),
    'contact':             ('contact/index.html', 'Book a SmashSwing Demo',
                            'Book a 30-minute call with SmashSwing founder TJ Schier, or send a note about your space.'),
}
NO_CTA = {'contact', 'consultation'}
CTA_LEAD = {}
CTA_LEAD_DEFAULT = 'Pick a time on TJ’s calendar. We will show you how SmashSwing fits your space.'
# retired pages: send old links to their new homes (relative, so it works on any base path)
REDIRECTS = {'products': '../who-its-for/', 'case-studies': '../press/'}

HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#000000">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="website">
  <link rel="icon" href="/brand/logomark-color.svg" type="image/svg+xml">
  <link rel="preload" href="/fonts/archivo-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/src/styles/reset.css">
  <link rel="stylesheet" href="/src/styles/tokens.css">
  <link rel="stylesheet" href="/src/styles/base.css">
  <link rel="stylesheet" href="/src/styles/home.css">
  <link rel="stylesheet" href="/src/styles/deck.css">
  <link rel="stylesheet" href="/src/styles/consult.css">
</head>
<body data-page="{page}">
'''
TAIL = '''
<script type="module" src="/src/main.js"></script>
</body>
</html>
'''
def include(m):
    return open(P('src', 'partials', 'blocks', f'{m.group(1)}.html')).read()

for page, (out, title, desc) in PAGES.items():
    body = open(P('src', 'pages', f'{page}.html')).read()
    body = re.sub(r'<!--#include ([\w-]+)-->', include, body)
    nav = re.sub(r'\{\{active:([\w-]+)\}\}', lambda m: ' aria-current="page"' if m.group(1) == page else '', partials['nav'])
    assert '{{cta_lead}}' in partials['cta'], 'cta partial lost its placeholder'
    cta = partials['cta'].replace('{{cta_lead}}', CTA_LEAD.get(page, CTA_LEAD_DEFAULT))
    head = HEAD.format(title=title, desc=desc, page=page)
    if page == 'home':
        head = head.replace('  <link rel="stylesheet" href="/src/styles/reset.css">', '  <link rel="preload" href="/img/photos/gunswinger-wide.webp" as="image" fetchpriority="high">\n  <link rel="stylesheet" href="/src/styles/reset.css">', 1)
    html = head + partials['icons'] + nav + '\n<main id="main">\n' + body + '\n</main>\n' + (cta if page not in NO_CTA else '') + partials['footer'] + TAIL
    html = html.replace('{{CAL}}', CAL)
    assert '{{' not in html, f'unfilled placeholder in {page}: ' + html[html.index('{{'):html.index('{{') + 40]
    # internal links get the deploy base (GitHub Pages serves the site under /smashswing/)
    html = re.sub(r'href="/(?=(what-is-smashswing|vs-traditional-sims|technology|who-its-for|press|consultation|contact|privacy|terms|accessibility)/|docs/|"|#)', f'href="{BASE}', html)
    os.makedirs(os.path.dirname(P(out)) or ROOT, exist_ok=True)
    open(P(out), 'w').write(html)
    print('wrote', out)

for old, target in REDIRECTS.items():
    d = P('public', old); os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w').write(f'<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url={target}"><link rel="canonical" href="{target}"></head><body><p>This page moved. <a href="{target}">Go to the new page</a>.</p></body></html>\n')
    print('redirect', old, '->', target)
