#!/usr/bin/env python3
"""Assemble the static pages: src/pages/*.html bodies + shared partials → site root."""
import os, re
BASE = os.environ.get('SITE_BASE', '/').rstrip('/') + '/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
partials = {n: open(P('src', 'partials', f'{n}.html')).read() for n in ['nav', 'footer', 'cta']}

PAGES = {
    'home':         ('index.html',              'SmashSwing | Multiplayer Golf Simulators and Indoor Ranges', 'SmashSwing builds multiplayer golf simulators and indoor ranges for venues. Golfers hit real balls at one screen together while every shot is tracked.'),
    'products':     ('products/index.html',     'Products | SmashSwing Immersive', 'Two formats, one engine: the Multiplayer Simulator and the Cinematic Indoor Range.'),
    'technology':   ('technology/index.html',   'Technology | SmashSwing Immersive', 'Point-of-contact tracking: the ball strikes the screen, and the game reacts at that pixel.'),
    'case-studies': ('case-studies/index.html', 'Case studies | SmashSwing Immersive', 'Where SmashSwing is playing: The River Club of Mequon and the Lewisville showroom.'),
    'contact':      ('contact/index.html',      'Book a demo | SmashSwing Immersive', 'See SmashSwing in Lewisville, Texas, or have it brought to you.'),
    'consultation': ('consultation/index.html', 'Consultation | SmashSwing Immersive', 'Book a consult call with TJ Schier about golf entertainment, indoor ranges and competitive socializing venues.'),
}
NO_CTA = {'contact', 'consultation'}
# the closing band line: the homepage carries the approved homepage copy, inner pages keep theirs
CTA_LEAD = {'home': 'See how SmashSwing can bring multiplayer golf and more guests to your venue.'}
CTA_LEAD_DEFAULT = 'See it in Lewisville, or we’ll bring it to you.'
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
</head>
<body data-page="{page}">
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
    cta = partials['cta'].replace('{{cta_lead}}', CTA_LEAD.get(page, CTA_LEAD_DEFAULT))
    head = HEAD.format(title=title, desc=desc, page=page)
    if page == 'home':
        head = head.replace('  <link rel="stylesheet" href="/src/styles/reset.css">', '  <link rel="preload" href="/img/hero-poster.webp" as="image" fetchpriority="high">\n  <link rel="stylesheet" href="/src/styles/reset.css">', 1)
    html = head + nav + '\n<main id="main">\n' + body + '\n</main>\n' + (cta if page not in NO_CTA else '') + partials['footer'] + TAIL
    # internal links get the deploy base (GitHub Pages serves the site under /smashswing/)
    html = re.sub(r'href="/(?=(products|technology|case-studies|consultation|contact|privacy|terms|accessibility)/|docs/|")', f'href="{BASE}', html)
    os.makedirs(os.path.dirname(P(out)) or ROOT, exist_ok=True)
    open(P(out), 'w').write(html)
    print('wrote', out)
