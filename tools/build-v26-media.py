#!/usr/bin/env python3
"""Media for the minimal-change update: real photos and TJ's deck art in the existing slots."""
import os, subprocess, fitz
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, IMG, VID = os.path.join(ROOT, 'source'), os.path.join(ROOT, 'public/img'), os.path.join(ROOT, 'public/video')

def save(im, rel, w=None, q=82):
    if w and im.width > w: im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    im.convert('RGB').save(os.path.join(IMG, rel), quality=q, method=6); print(rel, im.size)

# TJ on stage at Golf Business TechCon, cropped above the burned-in subtitle
gbtc = Image.open(os.path.join(SRC, 'drive', 'GBTC speaking.jpg')).convert('RGB')
save(gbtc.crop((80, 0, 1840, 782)), 'photos/founder-tj.webp')          # 2.25:1 founder slot
save(gbtc.crop((0, 40, 1920, 573)), 'photos/tj-stage-wide.webp')       # 3.6:1 consulting banner

# "Where you hit matters" art from deck slide 7 (players and hit points, no slide text)
doc = fitz.open(os.path.join(SRC, 'deck', 'emyrge-deck.pdf'))
z = 1672 / 768
pix = doc[6].get_pixmap(matrix=fitz.Matrix(z, z), clip=fitz.Rect(12, 90, 780, 522))
s7 = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
save(s7.crop((700, 0, 1673, 600)), 'deck/poc-hero.webp', q=84)

# 4:3 clip of real multi-player play at The River Club (simulator tab)
T = os.path.join(SRC, 'drive', 'SmashSwing Testimonial.mp4')
Z = os.path.join(SRC, 'drive', 'SmashSwing Teaser 5-31-26.mp4')
segs = [(T, 13.0, 16.0, 0.125), (T, 31.45, 35.0, 0.125), (Z, 26.5, 30.05, 0.0), (T, 37.6, 40.7, 0.125)]
args, filt = [], ''
for i, (f, s, e, x) in enumerate(segs):
    args += ['-ss', str(s), '-to', str(e), '-i', f]
    filt += f'[{i}:v]crop=ih*4/3:ih:iw*{x}:0,scale=960:720,fps=30,setsar=1,format=yuv420p[v{i}];'
filt += ''.join(f'[v{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=0[out]'
out = os.path.join(VID, 'clip-sim43.mp4')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args, '-filter_complex', filt, '-map', '[out]', '-an',
                '-c:v', 'libx264', '-preset', 'slow', '-crf', '26', '-profile:v', 'high', '-movflags', '+faststart', out], check=True)
print('clip-sim43.mp4', f'{os.path.getsize(out) / 1e6:.1f} MB')
tmp = os.path.join(SRC, '_p.png')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-ss', '0.4', '-i', out, '-frames:v', '1', tmp], check=True)
save(Image.open(tmp), 'photos/sim43-poster.webp'); os.remove(tmp)
