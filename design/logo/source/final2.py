# Round 7 logo: "ek sitara" (one star).
# One ink colour for the letters, the star is the only accent, and its centre is a real hole.
import json, math, os
from logo import W, LAT, dots_of, NEEL, KESAR, GHEE, INK

STAR_PTS = [(32,4),(40.2,12.2),(51.8,12.2),(51.8,23.8),(60,32),(51.8,40.2),(51.8,51.8),(40.2,51.8),
            (32,60),(23.8,51.8),(12.2,51.8),(12.2,40.2),(4,32),(12.2,23.8),(12.2,12.2),(23.8,12.2)]
HOLE = 9.5  # centre hole radius in the 64 box (star radius 28)

def star_d(cx, cy, R, hole=True):
    """8-point star with a punched centre, as one path (even-odd)"""
    k = R / 28.0
    pts = [(cx + (x - 32) * k, cy + (y - 32) * k) for x, y in STAR_PTS]
    d = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + ' Z'
    if hole:
        r = HOLE * k
        d += f' M{cx + r:.1f} {cy:.1f} A{r:.1f} {r:.1f} 0 1 0 {cx - r:.1f} {cy:.1f} A{r:.1f} {r:.1f} 0 1 0 {cx + r:.1f} {cy:.1f} Z'
    return d

def bbox_union(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]

def urdu_parts(ink, accent, starscale=2.5, star_as='star'):
    """letters + dots in ink; the dot of ن becomes the star (or a plain accent dot)"""
    F = W['nastaliq']; D = dots_of('nastaliq')
    body = ''.join(f'<path d="{b["d"]}" transform="translate({b["x"]} {b["y"]})"/>' for b in F['base'])
    seq = [d for cl in (0, 2, 3) for d in D.get(cl, [])]
    md = min(math.hypot(a['cx'] - b['cx'], a['cy'] - b['cy']) for a in seq for b in seq if a is not b)
    rr = min(max(d['r'] for d in seq), md / 2 * 0.86)
    dots = ''; acc = ''; bb = list(F['bounds'])
    for cl, lst in D.items():
        for d in lst:
            if cl == 2:
                if star_as == 'star':
                    R = rr * starscale
                    acc = f'<path d="{star_d(d["cx"], d["cy"], R)}" fill="{accent}" fill-rule="evenodd"/>'
                    bb = bbox_union(bb, [d['cx'] - R, d['cy'] - R, d['cx'] + R, d['cy'] + R])
                else:
                    r = rr * 1.5
                    acc = f'<circle cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="{r:.1f}" fill="{accent}"/>'
                continue
            dots += f'<circle cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="{rr:.1f}"/>'
    g = f'<g transform="scale(1,-1)"><g fill="{ink}">{body}{dots}</g>{acc}</g>'
    return g, bb  # bb in font units (y up)

def latin_parts(ink, accent, star=True):
    L = LAT['manrope']; body = ''; acc = ''; shift = 0; bb = None
    for it in L['items']:
        b = it['bounds']; x = it['x'] + shift
        if it['ch'] == 'o' and star:
            R = (b[3] - b[1]) / 2 * 1.24
            extra = 2 * R * 0.93 - (b[2] - b[0])          # room the star needs beyond the o
            cx = x + (b[0] + b[2]) / 2 + extra / 2; cy = (b[1] + b[3]) / 2
            acc = f'<path d="{star_d(cx, cy, R)}" fill="{accent}" fill-rule="evenodd"/>'
            shift += extra
            continue
        body += f'<path d="{it["d"]}" transform="translate({x:.0f} {it["y"]})"/>'
    x0, y0, x1, y1 = L['bounds']
    g = f'<g transform="scale(1,-1)"><g fill="{ink}">{body}</g>{acc}</g>'
    return g, [x0, y0, x1 + shift, y1]

def doc(g, bb, pad, bg=None, w=None, h=None):
    """bb is y-up; flip to the svg's y-down viewBox"""
    x0, y0, x1, y1 = bb
    vb = (x0 - pad, -(y1 + pad), x1 - x0 + 2 * pad, y1 - y0 + 2 * pad)
    size = (f' width="{w}"' if w else '') + (f' height="{h}"' if h else '')
    rect = f'<rect x="{vb[0]:.0f}" y="{vb[1]:.0f}" width="{vb[2]:.0f}" height="{vb[3]:.0f}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg"{size} viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" '
            f'role="img" aria-label="Pohnch">{rect}{g}</svg>')

TAG = json.load(open('tagline.json'))

def lockup(ink, accent, tagline=False, bg=None):
    """Latin wordmark (with the star) on the left, Urdu word on the right with its ن dot in the accent colour"""
    lg, lb = latin_parts(ink, accent)
    ug, ub = urdu_parts(ink, accent, star_as='dot')
    cap = lb[3] - 0                         # Latin cap height (P, h ascend to 1440)
    uh = ub[3] - ub[1]; s = cap * 2.05 / uh   # Urdu word height relative to the cap height
    gap = cap * 0.55
    lw = lb[2] - lb[0]
    ux = lb[2] + gap - ub[0] * s
    # centre the Urdu word on the Latin x-height band
    uy_mid = (ub[1] + ub[3]) / 2 * s; target = cap * 0.40
    uy = target - uy_mid
    # rule between them
    rule_x = lb[2] + gap / 2
    rule = f'<rect x="{rule_x - 14:.0f}" y="{-cap * 1.12:.0f}" width="28" height="{cap * 1.3:.0f}" rx="14" fill="{accent}" opacity="0"/>'
    inner = (lg + f'<g transform="translate({ux:.0f} {-uy:.0f}) scale({s:.4f})">{ug}</g>')
    top = max(lb[3], ub[3] * s + uy); bot = min(lb[1], ub[1] * s + uy)
    right = ux + ub[2] * s
    if tagline:
        x0t, y0t, x1t, y1t = TAG['bounds']; tw = lw * 0.98; ts = tw / (x1t - x0t)
        ty = bot - cap * 0.22
        paths = ''.join(f'<path d="{it["d"]}" transform="translate({it["x"]} {it["y"]})"/>' for it in TAG['items'])
        inner += f'<g transform="translate({lb[0] + 20:.0f} {-(ty):.0f}) scale({ts:.4f},{-ts:.4f}) translate({-x0t} {-y1t})" fill="{KESAR if ink == GHEE else ink}">{paths}</g>'
        bot = ty - (y1t - y0t) * ts
    return inner, [lb[0], bot, right, top]

def app_icon(size=1024):
    R = size * 0.33
    d = star_d(size / 2, size / 2, R)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
            f'<rect width="{size}" height="{size}" rx="{size * 0.225:.0f}" fill="{NEEL}"/>'
            f'<path d="{d}" fill="{KESAR}" fill-rule="evenodd"/></svg>')

def favicon():
    d = star_d(32, 32, 28)
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="{d}" fill="{KESAR}" fill-rule="evenodd"/></svg>'

if __name__ == '__main__':
    out = 'kit7'; os.makedirs(out, exist_ok=True)
    files = {}
    for name, ink, acc in [('', NEEL, KESAR), ('-on-neel', GHEE, KESAR), ('-one-colour', NEEL, NEEL), ('-white', '#FFFFFF', '#FFFFFF')]:
        g, bb = urdu_parts(ink, acc); files[f'pohnch-mark-urdu{name}'] = doc(g, bb, 60)
        g, bb = latin_parts(ink, acc); files[f'pohnch-wordmark{name}'] = doc(g, bb, 60)
        g, bb = lockup(ink, acc); files[f'pohnch-lockup{name}'] = doc(g, bb, 80)
        g, bb = lockup(ink, acc, tagline=True); files[f'pohnch-lockup-tagline{name}'] = doc(g, bb, 80)
    files['pohnch-app-icon'] = app_icon()
    files['pohnch-star'] = favicon()
    for k, v in files.items():
        open(f'{out}/{k}.svg', 'w').write(v)
    print(len(files), 'files')
