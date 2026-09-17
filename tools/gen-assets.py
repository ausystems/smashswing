#!/usr/bin/env python3
"""
Procedural placeholder assets for the SmashSwing preview.

No final footage exists yet, so every media slot is rendered as a monochrome
"telemetry render" of the projection screen: black plane, faint grid, drifting
asteroid polygons, balls in flight, and the shatter at the point of contact.
All output uses only black / white / bone. The pink dot is rendered by the DOM,
never baked into media.

Usage:  python3 tools/gen-assets.py [hero|seq|products|stills|all]
"""
import math, os, random, subprocess, sys, shutil, tempfile
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'public')
TMP = tempfile.mkdtemp(prefix='smash-assets-')

WHITE = (255, 255, 255)
BONE = (239, 237, 230)

def g(v):
    v = max(0.0, min(1.0, v))
    return (int(255 * v),) * 3

def bone(v):
    v = max(0.0, min(1.0, v))
    return tuple(int(c * v) for c in BONE)

def lerp(a, b, t):
    return a + (b - a) * t

def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- canvas
class Canvas:
    def __init__(self, w, h, ss=2):
        self.w, self.h, self.ss = w, h, ss
        self.im = Image.new('RGB', (w * ss, h * ss), (0, 0, 0))
        self.d = ImageDraw.Draw(self.im)

    def S(self, pts):
        return [(x * self.ss, y * self.ss) for x, y in pts]

    def poly(self, pts, outline=None, fill=None, width=1):
        self.d.polygon(self.S(pts), fill=fill, outline=outline, width=max(1, int(width * self.ss)))

    def line(self, a, b, col, width=1):
        self.d.line(self.S([a, b]), fill=col, width=max(1, int(width * self.ss)))

    def circle(self, c, r, fill=None, outline=None, width=1):
        x, y = c
        s = self.ss
        self.d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s],
                       fill=fill, outline=outline, width=max(1, int(width * s)))

    def rect(self, a, b, fill=None, outline=None, width=1):
        self.d.rectangle(self.S([a, b]), fill=fill, outline=outline, width=max(1, int(width * self.ss)))

    def grid(self, step, v, rect=None, offset=(0, 0)):
        x0, y0, x1, y1 = rect or (0, 0, self.w, self.h)
        col = g(v)
        ox, oy = offset
        x = x0 + (ox % step)
        while x <= x1:
            self.line((x, y0), (x, y1), col, 1)
            x += step
        y = y0 + (oy % step)
        while y <= y1:
            self.line((x0, y), (x1, y), col, 1)
            y += step

    def finish(self, vignette=0.42, grain=0.0):
        im = self.im.resize((self.w, self.h), Image.LANCZOS)
        if vignette > 0 or grain > 0:
            a = np.asarray(im).astype(np.float32) / 255.0
            if vignette > 0:
                yy, xx = np.mgrid[0:self.h, 0:self.w].astype(np.float32)
                dx = (xx - self.w / 2) / (self.w / 2)
                dy = (yy - self.h / 2) / (self.h / 2)
                d = np.sqrt(dx * dx + dy * dy) / math.sqrt(2)
                m = 1.0 - vignette * np.power(d, 2.2)
                a *= m[..., None]
            if grain > 0:
                rng = np.random.default_rng(7)
                a += rng.normal(0, grain, a.shape[:2])[..., None]
            im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
        return im

# ---------------------------------------------------------------- shapes
def asteroid(cx, cy, r, seed, n=None, rot=0.0):
    rng = random.Random(seed)
    n = n or rng.randint(7, 11)
    pts = []
    for i in range(n):
        a = rot + i / n * math.tau + rng.uniform(-0.12, 0.12)
        rr = r * rng.uniform(0.70, 1.0)
        pts.append((cx + math.cos(a) * rr, cy + math.sin(a) * rr))
    return pts

def draw_asteroid(cv, pts, v=0.72, fill=0.06, width=2):
    cv.poly(pts, outline=g(v), fill=g(fill), width=width)

def shards_of(pts, cx, cy, seed):
    """Split a polygon into radial triangular shards with outward velocity."""
    rng = random.Random(seed)
    out = []
    n = len(pts)
    for i in range(n):
        a, b = pts[i], pts[(i + 1) % n]
        c = (cx + rng.uniform(-6, 6), cy + rng.uniform(-6, 6))
        mx, my = (a[0] + b[0]) / 2 - cx, (a[1] + b[1]) / 2 - cy
        L = math.hypot(mx, my) or 1
        out.append({
            'tri': [c, a, b],
            'dir': (mx / L, my / L),
            'speed': rng.uniform(0.7, 1.35),
            'spin': rng.uniform(-1.6, 1.6),
        })
    return out

def draw_shards(cv, shards, tau, cx, cy, reach=560, v=0.9):
    """tau 0..1 after impact."""
    if tau < 0:
        return
    k = 1 - math.exp(-3.2 * tau)
    fade = max(0.0, 1 - tau) ** 1.1
    for s in shards:
        ox = s['dir'][0] * s['speed'] * reach * k
        oy = s['dir'][1] * s['speed'] * reach * k
        ang = s['spin'] * tau * 2.2
        tri = s['tri']
        gx = sum(p[0] for p in tri) / 3
        gy = sum(p[1] for p in tri) / 3
        pts = []
        for x, y in tri:
            rx, ry = x - gx, y - gy
            sc = 1 - 0.35 * tau
            px = gx + (rx * math.cos(ang) - ry * math.sin(ang)) * sc + ox
            py = gy + (rx * math.sin(ang) + ry * math.cos(ang)) * sc + oy
            pts.append((px, py))
        cv.poly(pts, outline=g(v * fade), fill=g(0.16 * fade), width=2)

def draw_ring(cv, c, tau, rmax=900, v=0.85, width=2):
    if tau < 0 or tau > 1:
        return
    r = rmax * (1 - (1 - tau) ** 3)
    cv.circle(c, r, outline=g(v * (1 - tau) ** 1.4), width=width)

def draw_ball(cv, pos, r, vel=(0, 0), v=1.0):
    x, y = pos
    vx, vy = vel
    sp = math.hypot(vx, vy)
    if sp > 0.5:
        n = 3
        for i in range(n, 0, -1):
            t = i / n
            cv.circle((x - vx * t * 0.9, y - vy * t * 0.9), r * (1 - 0.15 * t), fill=g(v * 0.22 * (1 - t) + 0.04))
    cv.circle((x, y), r, fill=g(v))

def perspective(t, k=0.32):
    """Screen-space progress of an object receding at constant speed."""
    t = max(0.0, min(1.0, t))
    return t / (t + k * (1 - t))

# ---------------------------------------------------------------- ffmpeg
def encode(pattern, out_base, fps=24, w=None, av1=True, crf264=24, crfav1=42, loop=False):
    vf = 'format=yuv420p'
    if w:
        vf = f'scale={w}:-2:flags=lanczos,' + vf
    base = ['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-framerate', str(fps), '-i', pattern]
    subprocess.run(base + ['-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf264),
                           '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
                           out_base + '.mp4'], check=True)
    if av1:
        subprocess.run(base + ['-vf', vf, '-c:v', 'libsvtav1', '-preset', '5', '-crf', str(crfav1),
                               '-svtav1-params', 'tune=0', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
                               out_base + '.av1.mp4'], check=True)

def frames_dir(name):
    d = os.path.join(TMP, name)
    os.makedirs(d, exist_ok=True)
    return d

# ================================================================ HERO
def render_hero():
    """12s seamless loop, 960x540 render → 1920 encode. Dark projection room."""
    W, H, FPS, DUR = 960, 540, 24, 12
    N = FPS * DUR
    d = frames_dir('hero')
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    sx0, sx1, sy0, sy1 = 0.05 * W, 0.95 * W, 0.17 * H, 0.70 * H
    # soft screen mask
    def edge(v, lo, hi, s):
        return np.clip((v - lo) / s, 0, 1) * np.clip((hi - v) / s, 0, 1)
    smask = edge(xx, sx0, sx1, 18) * edge(yy, sy0, sy1, 14)
    # vertical grade inside screen (top darker, so caps sit under 12%)
    grade = np.clip((yy - sy0) / (sy1 - sy0), 0, 1)
    grade = 0.55 + 0.45 * grade
    rng = random.Random(3)
    blobs = []
    for i in range(7):
        blobs.append({
            'cx': rng.uniform(sx0 + 80, sx1 - 80), 'cy': rng.uniform(sy0 + 40, sy1 - 40),
            'ax': rng.uniform(60, 220), 'ay': rng.uniform(20, 70),
            'kx': rng.choice([1, 1, 2]), 'ky': rng.choice([1, 2, 3]),
            'px': rng.uniform(0, math.tau), 'py': rng.uniform(0, math.tau),
            'sig': rng.uniform(70, 170), 'amp': rng.uniform(0.10, 0.26),
        })
    rocks = []
    for i in range(9):
        rocks.append({
            'cx': rng.uniform(sx0 + 60, sx1 - 60), 'cy': rng.uniform(sy0 + 30, sy1 - 30),
            'r': rng.uniform(14, 40), 'seed': i * 13 + 5,
            'orb': rng.uniform(6, 22), 'k': rng.choice([1, 1, 2]), 'ph': rng.uniform(0, math.tau),
            'spin': rng.uniform(-0.6, 0.6),
        })
    vign = None
    dx = (xx - W / 2) / (W / 2); dy = (yy - H / 2) / (H / 2)
    vign = 1.0 - 0.5 * np.power(np.sqrt(dx * dx + dy * dy) / math.sqrt(2), 2.0)
    for f in range(N):
        t = f / N  # 0..1, one full loop
        th = t * math.tau
        field = np.full((H, W), 0.030, np.float32)
        for b in blobs:
            cx = b['cx'] + b['ax'] * math.sin(b['kx'] * th + b['px'])
            cy = b['cy'] + b['ay'] * math.sin(b['ky'] * th + b['py'])
            field += b['amp'] * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * b['sig'] ** 2))
        field *= grade
        # rocks drawn on a PIL layer
        layer = Image.new('L', (W * 2, H * 2), 0)
        ld = ImageDraw.Draw(layer)
        for r in rocks:
            cx = r['cx'] + r['orb'] * math.cos(r['k'] * th + r['ph'])
            cy = r['cy'] + r['orb'] * 0.5 * math.sin(r['k'] * th + r['ph'])
            pts = asteroid(cx, cy, r['r'], r['seed'], rot=r['spin'] * th)
            ld.polygon([(x * 2, y * 2) for x, y in pts], fill=18, outline=120, width=3)
        rock = np.asarray(layer.resize((W, H), Image.LANCZOS)).astype(np.float32) / 255.0
        screen = np.clip(field + rock * 0.55, 0, 1) * smask
        # floor reflection
        refl = np.flipud(screen)
        shift = int(sy1 + (H - sy1))  # mirror about sy1
        refl_img = Image.fromarray((np.clip(refl, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))
        refl = np.asarray(refl_img).astype(np.float32) / 255.0
        # position: reflection of row sy1-k should land at sy1+k
        off = int(H - 2 * sy1)
        refl = np.roll(refl, -off, axis=0)
        fall = np.clip(1 - (yy - sy1) / (H - sy1), 0, 1) ** 1.6 * (yy > sy1)
        refl *= fall * 0.22
        lum = np.clip(screen + refl, 0, 1) * vign
        rgb = np.stack([lum * (BONE[0] / 255), lum * (BONE[1] / 255), lum * (BONE[2] / 255)], -1)
        Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).save(os.path.join(d, f'{f:04d}.png'))
        if f % 48 == 0:
            print(f'  hero frame {f}/{N}')
    out = os.path.join(PUB, 'video', 'hero-placeholder')
    encode(os.path.join(d, '%04d.png'), out, fps=FPS, w=1920, crf264=25, crfav1=44)
    # poster = frame 0 at 1920
    Image.open(os.path.join(d, '0000.png')).resize((1920, 1080), Image.LANCZOS).save(
        os.path.join(PUB, 'img', 'hero-poster.webp'), quality=78, method=5)

# ================================================================ IMPACT SEQUENCE
IMPACT = (1010, 590)
IMPACT_FRAME = 54

def render_sequence():
    W, H, N = 1920, 1080, 120
    d = frames_dir('seq')
    rng = random.Random(11)
    field = []
    for i in range(16):
        while True:
            cx, cy = rng.uniform(90, W - 90), rng.uniform(70, H - 70)
            if math.hypot(cx - IMPACT[0], cy - IMPACT[1]) > 260:
                break
        field.append({'cx': cx, 'cy': cy, 'r': rng.uniform(26, 74), 'seed': 100 + i,
                      'vx': rng.uniform(-0.5, 0.5), 'vy': rng.uniform(-0.3, 0.3), 'spin': rng.uniform(-0.01, 0.01)})
    target_r = 118
    target_pts0 = asteroid(IMPACT[0], IMPACT[1], target_r, 777, n=10)
    shards = shards_of(target_pts0, IMPACT[0], IMPACT[1], 778)
    P0 = (640.0, 1010.0)
    for f in range(N):
        cv = Canvas(W, H, ss=2)
        post = f - IMPACT_FRAME
        tau = post / (N - 1 - IMPACT_FRAME) if post >= 0 else -1
        # shake
        ox = oy = 0
        if 0 <= post < 9:
            k = (1 - post / 9) * 9
            ox, oy = rng.uniform(-k, k), rng.uniform(-k, k)
        gv = 0.075 + (0.16 * max(0, 1 - post / 7) if post >= 0 else 0)
        cv.grid(96, gv, offset=(ox, oy))
        # drifting field
        for a in field:
            cx = a['cx'] + a['vx'] * f + ox
            cy = a['cy'] + a['vy'] * f + oy
            draw_asteroid(cv, asteroid(cx, cy, a['r'], a['seed'], rot=a['spin'] * f), v=0.58, fill=0.05)
        # target
        if post < 0:
            pulse = 0.62 + 0.10 * math.sin(f * 0.35)
            pts = [(x + ox, y + oy) for x, y in asteroid(IMPACT[0], IMPACT[1], target_r, 777, n=10, rot=f * 0.004)]
            draw_asteroid(cv, pts, v=pulse, fill=0.07, width=3)
        else:
            draw_shards(cv, shards, tau, IMPACT[0], IMPACT[1], reach=620, v=0.95)
            draw_ring(cv, IMPACT, post / 42, rmax=980, v=0.9, width=3)
            if post < 14:
                draw_ring(cv, IMPACT, post / 14, rmax=240, v=1.0, width=4)
        # ball
        if post < 0:
            t = f / IMPACT_FRAME
            p = perspective(t, 0.30)
            pp = perspective(max(0, t - 1 / IMPACT_FRAME), 0.30)
            x, y = lerp(P0[0], IMPACT[0], p), lerp(P0[1], IMPACT[1], p)
            px_, py_ = lerp(P0[0], IMPACT[0], pp), lerp(P0[1], IMPACT[1], pp)
            r = lerp(36, 7, p)
            draw_ball(cv, (x, y), r, vel=(x - px_, y - py_), v=1.0)
        elif post < 26:
            tb = post / 26
            x = IMPACT[0] - 140 * tb
            y = IMPACT[1] + 760 * tb * tb
            r = lerp(7, 15, tb)
            draw_ball(cv, (x, y), r, v=(1 - tb) ** 0.8)
        im = cv.finish(vignette=0.48)
        im.save(os.path.join(d, f'{f:04d}.png'))
        im.save(os.path.join(PUB, 'seq', f'frame_{f:03d}.webp'), quality=80, method=5)
        if f % 20 == 0:
            print(f'  seq frame {f}/{N}')
    # poster at impact frame (+2 so the shatter reads), 1600 wide
    Image.open(os.path.join(d, f'{IMPACT_FRAME + 2:04d}.png')).save(
        os.path.join(PUB, 'img', 'contact-poster.webp'), quality=80, method=5)
    Image.open(os.path.join(d, '0000.png')).save(
        os.path.join(PUB, 'img', 'contact-first.webp'), quality=80, method=5)
    # mobile fallback video (holds on the last frame a moment via extra frames)
    for k in range(24):
        shutil.copy(os.path.join(d, f'{N-1:04d}.png'), os.path.join(d, f'{N+k:04d}.png'))
    encode(os.path.join(d, '%04d.png'), os.path.join(PUB, 'video', 'contact'), fps=24, w=1280, crf264=24, crfav1=42)

# ================================================================ PRODUCT LOOPS
def render_product(name, wide):
    W, H, FPS, DUR = 960, 720, 24, 6
    N = FPS * DUR
    d = frames_dir(name)
    rng = random.Random(21 if wide else 22)
    if wide:
        rect = (40, 230, 920, 490)     # 3.4:1 letterboxed inside 4:3
        n_balls, lanes = 12, 12
    else:
        rect = (90, 70, 870, 640)
        n_balls, lanes = 4, 4
    x0, y0, x1, y1 = rect
    rocks = []
    for i in range(10 if wide else 7):
        rocks.append({'cx': rng.uniform(x0 + 30, x1 - 30), 'cy': rng.uniform(y0 + 20, y1 - 20),
                      'r': rng.uniform(10, 26) if wide else rng.uniform(16, 40), 'seed': 300 + i,
                      'orb': rng.uniform(3, 9), 'ph': rng.uniform(0, math.tau)})
    balls = []
    cycle = 72  # frames, 2 cycles per loop
    for i in range(n_balls):
        lane_x = x0 + (i + 0.5) / lanes * (x1 - x0)
        tx = lane_x + rng.uniform(-30, 30)
        ty = rng.uniform(y0 + 40, y1 - 40)
        balls.append({'sx': lane_x + rng.uniform(-20, 20), 'tx': tx, 'ty': ty,
                      'phase': rng.randint(0, cycle - 1), 'seed': 400 + i,
                      'shards': shards_of(asteroid(tx, ty, 22 if wide else 34, 400 + i), tx, ty, 500 + i)})
    for f in range(N):
        cv = Canvas(W, H, ss=2)
        th = f / N * math.tau
        cv.rect((x0, y0), (x1, y1), fill=g(0.035), outline=g(0.22), width=2)
        cv.grid(48 if wide else 64, 0.09, rect=rect)
        for r in rocks:
            cx = r['cx'] + r['orb'] * math.cos(2 * th + r['ph'])
            cy = r['cy'] + r['orb'] * 0.4 * math.sin(2 * th + r['ph'])
            draw_asteroid(cv, asteroid(cx, cy, r['r'], r['seed'], rot=0.2 * math.sin(th)), v=0.5, fill=0.05)
        for b in balls:
            ph = (f + b['phase']) % cycle
            flight = 40
            if ph < flight:
                t = ph / flight
                p = perspective(t, 0.35)
                x = lerp(b['sx'], b['tx'], p)
                y = lerp(H + 20, b['ty'], p)
                pr = lerp(14 if wide else 20, 3 if wide else 5, p)
                # target pulses while ball is in flight
                draw_asteroid(cv, asteroid(b['tx'], b['ty'], 22 if wide else 34, b['seed']), v=0.7, fill=0.08, width=2)
                draw_ball(cv, (x, y), pr, v=1.0)
            else:
                tau = (ph - flight) / (cycle - flight)
                draw_shards(cv, b['shards'], tau, b['tx'], b['ty'], reach=110 if wide else 180, v=0.9)
                draw_ring(cv, (b['tx'], b['ty']), tau * 1.6, rmax=90 if wide else 150, v=0.9, width=2)
        im = cv.finish(vignette=0.30)
        im.save(os.path.join(d, f'{f:04d}.png'))
    encode(os.path.join(d, '%04d.png'), os.path.join(PUB, 'video', name), fps=FPS, crf264=24, crfav1=42)
    Image.open(os.path.join(d, '0000.png')).save(os.path.join(PUB, 'img', f'{name}-poster.webp'), quality=78, method=5)

# ================================================================ STILLS
def still_field(cv, rect, step, rocks, seed, gv=0.08, rv=0.55, rmin=14, rmax=44):
    x0, y0, x1, y1 = rect
    rng = random.Random(seed)
    cv.rect((x0, y0), (x1, y1), fill=g(0.03), outline=g(0.2), width=2)
    cv.grid(step, gv, rect=rect)
    out = []
    for i in range(rocks):
        cx, cy, r = rng.uniform(x0 + 40, x1 - 40), rng.uniform(y0 + 30, y1 - 30), rng.uniform(rmin, rmax)
        pts = asteroid(cx, cy, r, seed * 10 + i)
        draw_asteroid(cv, pts, v=rv, fill=0.05)
        out.append((cx, cy, r, pts))
    return out

def save(im, rel, q=80):
    p = os.path.join(PUB, 'img', rel)
    im.save(p, quality=q, method=5)
    print('  wrote', rel)

def render_stills():
    # ---- carousel 4:3 @ 1200x900
    W, H = 1200, 900
    # 1 everyone hits at once
    cv = Canvas(W, H); rect = (60, 80, W - 60, H - 120)
    rocks = still_field(cv, rect, 60, 8, 1)
    for i, (sx, tgt) in enumerate(zip([180, 460, 740, 1020], rocks[:4])):
        t = [0.35, 0.62, 0.48, 0.8][i]; p = perspective(t, 0.35)
        x, y = lerp(sx, tgt[0], p), lerp(H + 10, tgt[1], p)
        draw_asteroid(cv, tgt[3], v=0.8, fill=0.09, width=3)
        draw_ball(cv, (x, y), lerp(26, 5, p), vel=((tgt[0] - sx) * 0.02, -9))
    save(cv.finish(0.35), 'card-everyone.webp')
    # 2 the screen hits back
    cv = Canvas(W, H); rect = (60, 80, W - 60, H - 120)
    still_field(cv, rect, 60, 6, 2)
    c = (760, 400); pts = asteroid(c[0], c[1], 120, 999, n=10)
    draw_shards(cv, shards_of(pts, c[0], c[1], 998), 0.22, c[0], c[1], reach=420, v=0.95)
    draw_ring(cv, c, 0.45, rmax=520, v=0.9, width=3)
    draw_ring(cv, c, 0.85, rmax=160, v=1.0, width=4)
    save(cv.finish(0.35), 'card-hitsback.webp')
    # 3 licensed arcade games
    cv = Canvas(W, H); rect = (60, 80, W - 60, H - 120)
    still_field(cv, rect, 60, 18, 3, rv=0.7, rmin=22, rmax=70)
    cv.poly([(600, 540), (578, 590), (600, 578), (622, 590)], outline=g(0.95), fill=g(0.1), width=3)
    save(cv.finish(0.35), 'card-arcade.webp')
    # 4 golf mode and party mode
    cv = Canvas(W, H)
    rect_l = (60, 80, 590, H - 120); rect_r = (610, 80, W - 60, H - 120)
    cv.rect(rect_l[:2], rect_l[2:], fill=g(0.03), outline=g(0.2), width=2)
    for k in range(9):
        y = 80 + k * 87.5
        cv.line((60, y), (590, y), g(0.10), 1)
    for k in range(6):
        x = 60 + k * 106
        cv.line((x, 80), (x, H - 120), g(0.10), 1)
    # lane + ball + tick marks (data feel)
    cv.line((325, H - 120), (325, 80), g(0.35), 2)
    draw_ball(cv, (325, 470), 9)
    for k in range(7):
        cv.line((300, 120 + k * 100), (350, 120 + k * 100), g(0.5), 2)
    still_field(cv, rect_r, 60, 9, 4, rv=0.7)
    c = (920, 380); pts = asteroid(c[0], c[1], 90, 555)
    draw_shards(cv, shards_of(pts, c[0], c[1], 556), 0.3, c[0], c[1], reach=260)
    save(cv.finish(0.35), 'card-modes.webp')
    # 5 the room changes
    cv = Canvas(W, H)
    rect = (40, 150, W - 40, 150 + int((W - 80) / 2.39))
    cv.rect(rect[:2], rect[2:], fill=g(0.06), outline=g(0.3), width=2)
    # soft light bands inside
    im = cv.finish(0.0)
    a = np.asarray(im).astype(np.float32) / 255
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for (cx, cy, s, amp) in [(400, 380, 190, 0.32), (820, 330, 150, 0.22), (620, 420, 260, 0.14)]:
        a += (amp * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * s * s)))[..., None] * \
             ((xx > rect[0]) & (xx < rect[2]) & (yy > rect[1]) & (yy < rect[3]))[..., None]
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8))
    cv2 = Canvas(W, H); cv2.im = Image.new('RGB', (W * 2, H * 2)); cv2.im.paste(im.resize((W * 2, H * 2))); cv2.d = ImageDraw.Draw(cv2.im)
    for row in range(5):
        for col in range(14):
            x = 120 + col * 70 + (row % 2) * 35
            y = 690 + row * 36
            cv2.circle((x, y), 5, fill=g(0.28 + 0.1 * (row % 2)))
    save(cv2.finish(0.35), 'card-room.webp')
    # 6 new seasons over the air
    cv = Canvas(W, H)
    cols, rows, tw, th = 8, 5, 128, 128
    ox, oy = (W - cols * tw) / 2, (H - rows * th) / 2 - 20
    lit = {(1, 1), (4, 2), (6, 3)}
    for r_ in range(rows):
        for c_ in range(cols):
            x, y = ox + c_ * tw, oy + r_ * th
            if (c_, r_) in lit:
                cv.rect((x + 6, y + 6), (x + tw - 6, y + th - 6), fill=g(0.92))
            else:
                cv.rect((x + 6, y + 6), (x + tw - 6, y + th - 6), outline=g(0.22), width=2)
    draw_ring(cv, (ox + 4.5 * tw, oy + 2.5 * th), 0.4, rmax=300, v=0.6, width=2)
    save(cv.finish(0.35), 'card-seasons.webp')

    # ---- case studies 3:2 @ 1500x1000
    W, H = 1500, 1000
    cv = Canvas(W, H); rect = (100, 90, W - 100, H - 170)
    rocks = still_field(cv, rect, 70, 9, 31, gv=0.10, rv=0.75)
    for i, (sx, tgt) in enumerate(zip([300, 640, 960, 1260], rocks[:4])):
        t = [0.55, 0.3, 0.72, 0.45][i]; p = perspective(t, 0.35)
        x, y = lerp(sx, tgt[0], p), lerp(H + 10, tgt[1], p)
        draw_asteroid(cv, tgt[3], v=0.9, fill=0.1, width=3)
        draw_ball(cv, (x, y), lerp(30, 6, p), vel=((tgt[0] - sx) * 0.02, -10))
    save(cv.finish(0.32), 'case-wisconsin.webp')
    # Texas: wide, rougher (grain), tighter crop
    cv = Canvas(W, H); rect = (-40, 260, W + 40, 740)
    rocks = still_field(cv, rect, 60, 14, 32, gv=0.08, rv=0.55, rmin=12, rmax=30)
    rng = random.Random(5)
    for i in range(12):
        sx = 40 + i * 125
        tgt = rocks[i % len(rocks)]
        t = rng.uniform(0.2, 0.85); p = perspective(t, 0.35)
        x, y = lerp(sx, tgt[0], p), lerp(H + 10, tgt[1], p)
        draw_ball(cv, (x, y), lerp(18, 4, p), vel=((tgt[0] - sx) * 0.02, -8), v=0.9)
    save(cv.finish(0.45, grain=0.045), 'case-texas.webp')

    # ---- founder poster 16:9 @ 1600x900 + thumb 3:16:9
    W, H = 1600, 900
    cv = Canvas(W, H)
    cv.grid(80, 0.06)
    cv.rect((520, 120), (1080, 780), outline=g(0.16), width=2)
    save(cv.finish(0.4), 'founder-poster.webp')
    cv = Canvas(672, 376)
    still_field(cv, (0, 40, 672, 336), 48, 6, 41, rv=0.6)
    draw_ball(cv, (300, 220), 8)
    save(cv.finish(0.4), 'founder-thumb.webp')

    # ---- coming soon still 1920x1080 (blurred by CSS)
    W, H = 1920, 1080
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.zeros((H, W), np.float32) + 0.04
    rng = random.Random(9)
    for i in range(9):
        cx, cy, s, amp = rng.uniform(100, W - 100), rng.uniform(200, H - 100), rng.uniform(120, 320), rng.uniform(0.12, 0.42)
        a += amp * np.exp(-((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * s * s))
    a += 0.18 * np.exp(-((yy - 640) ** 2) / (2 * 12 ** 2))  # horizon line
    rgb = np.stack([a * BONE[0] / 255, a * BONE[1] / 255, a * BONE[2] / 255], -1)
    im = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8))
    cv = Canvas(W, H); cv.im = im.resize((W * 2, H * 2)); cv.d = ImageDraw.Draw(cv.im)
    for i in range(40):
        x, y = rng.uniform(0, W), rng.uniform(660, H)
        cv.circle((x, y), rng.uniform(3, 9), fill=bone(rng.uniform(0.3, 0.8)))
    save(cv.finish(0.3), 'teaser-still.webp', q=70)

# ================================================================
if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    for p in ['video', 'img', 'seq']:
        os.makedirs(os.path.join(PUB, p), exist_ok=True)
    if what in ('all', 'stills'):
        print('stills'); render_stills()
    if what in ('all', 'seq'):
        print('impact sequence'); render_sequence()
    if what in ('all', 'products'):
        print('products'); render_product('product-sim', wide=False); render_product('product-range', wide=True)
    if what in ('all', 'hero'):
        print('hero'); render_hero()
    shutil.rmtree(TMP, ignore_errors=True)
    print('done')

# ================================================================ GAME RENDERS (brand colour)
# Only the on-screen game is allowed to carry colour. Exact brand values from the logo SVG.
PURPLE = (0x3B, 0x02, 0x59)
MAGENTA = (0xFF, 0x00, 0x6E)
AQUA = (0x0F, 0xFF, 0xFF)

def mix(c, v, base=(0, 0, 0)):
    v = max(0.0, min(1.0, v))
    return tuple(int(base[i] + (c[i] - base[i]) * v) for i in range(3))

def render_games():
    W, H = 1600, 1000
    # 1 — asteroids field on purple, aqua rocks, magenta shatter (the "screen hits back" hero for the games band)
    cv = Canvas(W, H)
    cv.rect((0, 0), (W, H), fill=PURPLE)
    x0, y0, x1, y1 = 0, 0, W, H
    col = mix(AQUA, 0.10, PURPLE)
    x = 0
    while x <= W:
        cv.line((x, 0), (x, H), col, 1); x += 80
    y = 0
    while y <= H:
        cv.line((0, y), (W, y), col, 1); y += 80
    rng = random.Random(61)
    for i in range(16):
        cx, cy, r = rng.uniform(60, W - 60), rng.uniform(60, H - 60), rng.uniform(22, 64)
        if math.hypot(cx - 1040, cy - 520) < 240:
            continue
        pts = asteroid(cx, cy, r, 900 + i)
        cv.poly(pts, outline=mix(AQUA, 0.85, PURPLE), fill=mix(AQUA, 0.10, PURPLE), width=2)
    c = (1040, 520)
    pts = asteroid(c[0], c[1], 130, 991, n=10)
    sh = shards_of(pts, c[0], c[1], 992)
    tau = 0.24
    k = 1 - math.exp(-3.2 * tau)
    for s in sh:
        ox = s['dir'][0] * s['speed'] * 480 * k; oy = s['dir'][1] * s['speed'] * 480 * k
        ang = s['spin'] * tau * 2.2
        tri = s['tri']; gx = sum(p[0] for p in tri) / 3; gy = sum(p[1] for p in tri) / 3
        q = []
        for x_, y_ in tri:
            rx, ry = x_ - gx, y_ - gy
            q.append((gx + (rx * math.cos(ang) - ry * math.sin(ang)) * 0.92 + ox, gy + (rx * math.sin(ang) + ry * math.cos(ang)) * 0.92 + oy))
        cv.poly(q, outline=AQUA, fill=mix(AQUA, 0.22, PURPLE), width=2)
    cv.circle(c, 520 * (1 - (1 - 0.5) ** 3), outline=mix(MAGENTA, 0.9, PURPLE), width=3)
    cv.circle(c, 170, outline=MAGENTA, width=4)
    cv.circle(c, 14, fill=MAGENTA)
    cv.circle((c[0] - 18, c[1] + 26), 9, fill=(255, 255, 255))
    save(cv.finish(0.25), 'game-asteroids.webp')
    # 2 — party mode: many balls, many small bursts, aqua + magenta on purple
    cv = Canvas(W, H)
    cv.rect((0, 0), (W, H), fill=PURPLE)
    x = 0
    while x <= W:
        cv.line((x, 0), (x, H), col, 1); x += 80
    y = 0
    while y <= H:
        cv.line((0, y), (W, y), col, 1); y += 80
    rng = random.Random(62)
    for i in range(12):
        cx, cy = 90 + i * 128 + rng.uniform(-30, 30), rng.uniform(220, 760)
        r = rng.uniform(40, 90)
        cv.circle((cx, cy), r, outline=mix(MAGENTA if i % 3 else AQUA, 0.9, PURPLE), width=3)
        cv.circle((cx, cy), r * 0.45, outline=mix(AQUA, 0.6, PURPLE), width=2)
        cv.circle((cx, cy), 10, fill=MAGENTA if i % 3 else AQUA)
        bx, by = cx + rng.uniform(-60, 60), cy + rng.uniform(120, 260)
        draw_ball(cv, (bx, by), rng.uniform(8, 16), vel=((cx - bx) * 0.05, -10))
    save(cv.finish(0.25), 'game-party.webp')
    # 3 — golf mode: clean lanes, one ball, aqua data ticks, magenta impact dot — on black (data, not chaos)
    cv = Canvas(W, H)
    cv.grid(80, 0.10)
    for k in range(5):
        x = 200 + k * 300
        cv.line((x, 120), (x, H - 120), g(0.35), 2)
    for k in range(9):
        y = 160 + k * 90
        cv.line((760, y), (840, y), mix(AQUA, 0.8), 2)
    draw_ball(cv, (800, 640), 12)
    cv.circle((800, 300), 40, outline=MAGENTA, width=3)
    cv.circle((800, 300), 8, fill=MAGENTA)
    save(cv.finish(0.3), 'game-golf.webp')

if __name__ == '__main__' and len(sys.argv) > 1 and sys.argv[1] == 'games':
    render_games(); print('done games')
