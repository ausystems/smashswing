#!/usr/bin/env python3
"""Builds the v3 images: crops from TJ's eMYRge deck, stills from the real River Club
footage, and press thumbnails. Sources live in /source (not deployed)."""
import os, fitz, subprocess
from PIL import Image, ImageFilter, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, PUB = os.path.join(ROOT, 'source'), os.path.join(ROOT, 'public', 'img')
for d in ('deck', 'photos', 'press'):
    os.makedirs(os.path.join(PUB, d), exist_ok=True)

def save(im, rel, w=None, q=82):
    if w and im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.convert('RGB').save(os.path.join(PUB, rel), quality=q, method=6)
    return im.size

# ---------- deck slides at native resolution (slide art sits at 12,90 to 780,522 pt)
doc = fitz.open(os.path.join(SRC, 'deck', 'emyrge-deck.pdf'))
z = 1672 / 768
def slide(n):
    pix = doc[n - 1].get_pixmap(matrix=fitz.Matrix(z, z), clip=fitz.Rect(12, 90, 780, 522))
    return Image.frombytes('RGB', (pix.width, pix.height), pix.samples)

def inpaint(im, cx, cy, r, iters=220):
    """Fill a disc by repeated blurring from its edge (removes the VS badge)."""
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    out = im.copy()
    for _ in range(iters):
        blur = out.filter(ImageFilter.GaussianBlur(4))
        out = Image.composite(blur, im, mask)
        im = out
    return out

CROPS = {
    3: {'vs-vanilla': (346, 396, 774, 806), 'vs-sundae': (872, 214, 1296, 806)},
    5: {'diff-balls': (18, 316, 545, 916), 'diff-contact': (578, 319, 1098, 916), 'diff-view': (1128, 316, 1658, 916)},
    6: {'mode-range': (18, 268, 555, 690), 'mode-games': (578, 290, 1110, 632), 'mode-library': (585, 636, 1105, 780), 'mode-virtual': (1138, 276, 1658, 690)},
    7: {'step-1': (130, 632, 388, 802), 'step-2': (532, 632, 790, 802), 'step-3': (930, 632, 1188, 802), 'step-4': (1342, 632, 1600, 802)},
    9: {'size-2': (20, 255, 355, 572), 'size-3': (357, 243, 745, 572), 'size-4': (745, 220, 1165, 572), 'size-6': (1171, 198, 1673, 572), 'ping-adaptive': (410, 700, 785, 942)},
    10: {'venue-golf-courses': (0, 190, 400, 418), 'venue-country-clubs': (472, 182, 800, 418), 'venue-driving-ranges': (872, 182, 1200, 418),
         'venue-simulator-venues': (1282, 168, 1673, 418), 'venue-hotels-resorts': (0, 540, 400, 785), 'venue-entertainment': (472, 540, 815, 785),
         'venue-restaurants-bars': (862, 540, 1205, 785), 'venue-other': (1288, 540, 1673, 785)},
    11: {'way-simulator': (0, 300, 580, 812), 'way-range': (590, 300, 1122, 812), 'way-campus': (1136, 300, 1673, 905)},
}
for n, crops in CROPS.items():
    im = slide(n)
    if n == 3:
        im = inpaint(im, 804, 458, 80)
    for name, box in crops.items():
        print('deck', name, save(im.crop(box), f'deck/{name}.webp', q=84))

# ---------- stills from the real footage
VID = os.path.join(SRC, 'drive')
STILLS = [  # (file, seconds, name, crop fraction (l,t,r,b) or None)
    ('SmashSwing Testimonial.mp4', 14.0, 'swing-pair', None),
    ('SmashSwing Testimonial.mp4', 19.0, 'party-bay', None),
    ('SmashSwing Testimonial.mp4', 33.0, 'two-swings', None),
    ('SmashSwing Testimonial.mp4', 37.7, 'gunswinger-wide', None),
    ('SmashSwing Testimonial.mp4', 50.0, 'brickbuster', None),
    ('SmashSwing Testimonial.mp4', 55.0, 'watch-party', None),
    ('SmashSwing Testimonial.mp4', 63.0, 'range-two', None),
    ('SmashSwing Teaser 5-31-26.mp4', 19.5, 'crowd', None),
    ('SmashSwing Teaser 5-31-26.mp4', 22.0, 'asteroids', None),
    ('SmashSwing Teaser 5-31-26.mp4', 27.5, 'gunswinger-kids', None),
    ('SmashSwing Teaser 5-31-26.mp4', 40.5, 'swing-crowd', None),
    ('SmashSwing Teaser 5-31-26.mp4', 47.6, 'smiles', None),
    ('SmashSwing Teaser 5-31-26.mp4', 50.5, 'watch-party-b', None),
    ('Virtual-multiplayer-teaser-v1.mov', 43.0, 'virtual-highfive', (0.03, 0.0, 0.97, 0.845)),
    ('Virtual-multiplayer-teaser-v1.mov', 33.5, 'virtual-four', (0.0, 0.0, 1.0, 0.80)),
]
tmp = os.path.join(SRC, '_frame.png')
for f, t, name, frac in STILLS:
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', str(t), '-i', os.path.join(VID, f),
                    '-frames:v', '1', '-vf', 'format=yuv420p', tmp], check=True)
    im = Image.open(tmp).convert('RGB')
    if frac:
        l, t2, r, b = frac
        im = im.crop((round(l * im.width), round(t2 * im.height), round(r * im.width), round(b * im.height)))
    print('photo', name, save(im, f'photos/{name}.webp', w=1600, q=80))
os.remove(tmp)

# River Club party photos (originals are 640x480)
for i, f in enumerate(['RC party8.jpeg'], start=6):
    print('gallery', save(Image.open(os.path.join(VID, f)), f'gallery-rc-{i}.webp', q=86))

# ---------- press thumbnails
for name in ('overview', 'keynote', 'workshop'):
    print('press', name, save(Image.open(os.path.join(SRC, 'thumbs', f'{name}.jpg')), f'press/{name}.webp', w=1280, q=80))
print('press tj-gbtc', save(Image.open(os.path.join(VID, 'GBTC speaking.jpg')).crop((400, 0, 1680, 800)), 'press/tj-gbtc.webp'))
print('done')
