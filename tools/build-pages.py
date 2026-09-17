#!/usr/bin/env python3
"""Assemble the static pages: src/pages/*.html bodies + shared partials → site root."""
import os, re
BASE = os.environ.get('SITE_BASE', '/').rstrip('/') + '/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(ROOT, *a)
partials = {n: open(P('src', 'partials', f'{n}.html')).read() for n in ['nav', 'footer', 'cta']}

PAGES = {
    'home':         ('index.html',              'SmashSwing Immersive — Everyone hits at once', 'Patent-pending multi-player, multi-ball golf. Three to twenty-four players hit real balls into one screen at the same moment, and the screen hits back. Book a demo in Lewisville, Texas.'),
    'products':     ('products/index.html',     'Products — SmashSwing Immersive', 'Two formats, one engine: the Multiplayer Simulator and the Cinematic Indoor Range.'),
    'technology':   ('technology/index.html',   'Technology — SmashSwing Immersive', 'Point-of-contact tracking: the ball strikes the screen, and the game reacts at that pixel.'),
    'case-studies': ('case-studies/index.html', 'Case studies — SmashSwing Immersive', 'Where SmashSwing is playing: The River Club of Mequon and the Lewisville showroom.'),
    'contact':      ('contact/index.html',      'Book a demo — SmashSwing Immersive', 'See SmashSwing in Lewisville, Texas, or have it brought to you.'),
}
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
    html = HEAD.format(title=title, desc=desc, page=page) + nav + '\n<main id="main">\n' + body + '\n</main>\n' + (partials['cta'] if page != 'contact' else '') + partials['footer'] + TAIL
    # internal links get the deploy base (GitHub Pages serves the site under /smashswing/)
    html = re.sub(r'href="/(?=(products|technology|case-studies|contact|privacy|terms|accessibility)/|")', f'href="{BASE}', html)
    os.makedirs(os.path.dirname(P(out)) or ROOT, exist_ok=True)
    open(P(out), 'w').write(html)
    print('wrote', out)
