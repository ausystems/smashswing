#!/usr/bin/env python3
"""v3 video cuts. Real River Club footage only: no interview shots, no burned-in titles."""
import os, subprocess, time
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = os.path.join(ROOT, 'source/drive/SmashSwing Testimonial.mp4')
Z = os.path.join(ROOT, 'source/drive/SmashSwing Teaser 5-31-26.mp4')
V = os.path.join(ROOT, 'source/drive/Virtual-multiplayer-teaser-v1.mov')
O = os.path.join(ROOT, 'public/video'); os.makedirs(O, exist_ok=True)

def size(p): return f'{os.path.getsize(p) / 1e6:.1f} MB'

def cut(out, w, h, crf, segs):
    args, filt = [], ''
    for i, (f, s, e) in enumerate(segs):
        args += ['-ss', str(s), '-to', str(e), '-i', f]
        filt += f'[{i}:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},fps=30,setsar=1,format=yuv420p[v{i}];'
    filt += ''.join(f'[v{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=0[out]'
    dst = os.path.join(O, f'{out}.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *args, '-filter_complex', filt, '-map', '[out]', '-an',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-profile:v', 'high', '-movflags', '+faststart', dst], check=True)
    print(time.strftime('%T'), out, size(dst), flush=True)
    return dst

def full(out, src, crf):
    dst = os.path.join(O, f'{out}.mp4')
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', src, '-vf', 'scale=1280:-2,fps=30,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-profile:v', 'high', '-c:a', 'aac', '-b:a', '128k',
                    '-movflags', '+faststart', dst], check=True)
    print(time.strftime('%T'), out, size(dst), flush=True)

# hero: groups playing games together (about 20 s)
hero = cut('hero-groups', 1600, 900, 27, [(T, 37.60, 40.70), (Z, 20.95, 24.35), (T, 31.45, 35.00), (Z, 26.50, 30.05), (T, 47.95, 51.50), (T, 17.45, 20.50)])
av1 = os.path.join(O, 'hero-groups.av1.mp4')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', hero, '-c:v', 'libsvtav1', '-preset', '6', '-crf', '38', '-an', '-movflags', '+faststart', av1], check=True)
print(time.strftime('%T'), 'hero-groups.av1', size(av1), flush=True)
# point of contact games: GunSwinger, BrickBuster, Asteroids
cut('clip-games', 1280, 720, 27, [(T, 37.60, 40.70), (T, 47.95, 53.60), (Z, 20.95, 24.35)])
# multi-player range mode: two golfers hitting at once
cut('clip-range', 1280, 720, 27, [(T, 61.20, 67.00), (Z, 30.30, 35.40)])
# full videos with sound
full('teaser-reel', Z, 26)
full('river-club', T, 26)
full('virtual-courses', V, 25)
print('ENCODED', flush=True)
