import math, json
from logo import *
from variants import parts
def bez(P0,P1,P2,P3,t): return tuple((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t**2*cc+t**3*e for a,b,cc,e in zip(P0,P1,P2,P3))
def ring_dots(info, color=KESAR):
    x0,y0,x1,y1=info['bounds']; H=y1-y0; w=x1-x0; g=0.13*H; rr=info['rr']
    hx,hy=info['home']; sx,sy,R=info['star']; mx=(x0+x1)/2
    p=[(hx+rr*0.2,hy-rr*1.9),(mx,y0-g),(x0-g,(y0+y1)/2),(sx-R*1.25,sy-R*0.1)]
    c=[((hx+g*0.9,hy-(hy-(y0-g))*0.65),(mx+w*0.36,y0-g)),((mx-w*0.36,y0-g),(x0-g,y0+H*0.12)),((x0-g,(y0+y1)/2+H*0.33),(sx-R*3.2,sy+R*0.2))]
    segs=[(p[0],c[0][0],c[0][1],p[1]),(p[1],c[1][0],c[1][1],p[2]),(p[2],c[2][0],c[2][1],p[3])]
    pts=[]; 
    for sg in segs:
        for k in range(200): pts.append(bez(*sg,k/200))
    pts.append(p[3])
    acc=[0]
    for a,b in zip(pts,pts[1:]): acc.append(acc[-1]+math.hypot(b[0]-a[0],b[1]-a[1]))
    total=acc[-1]; out=''; s=0; n=0
    while s<=total:
        t=s/total; r=rr*(0.22+0.36*t**1.4)
        i=next(k for k,v in enumerate(acc) if v>=s); q=pts[i]
        out+=f'<circle cx="{q[0]:.1f}" cy="{q[1]:.1f}" r="{r:.1f}" fill="{color}"/>'
        s+=rr*(1.15+1.2*t); n+=1
    return out,(x0-g*1.35,y0-g*1.35,x1+g*0.55,y1+g*0.35)
def mark(variant='ring', dark=False, key='nastaliq', mono=None, pad=40):
    ink=mono or (GHEE if dark else NEEL); home=mono or (PISTA if dark else ZAM); dotc=mono or KESAR
    body,marks,info=parts(key,ink=ink,home=home,dotc=dotc,starfill=mono or KESAR,stardot=(NEEL if not dark else NEEL) if not mono else (GHEE if dark else '#FFFFFF'))
    sx,sy,R=info['star']; x0,y0,x1,y1=info['bounds']; bx=[min(x0,sx-R),min(y0,sy-R),max(x1,sx+R),max(y1,sy+R)]
    extra=''
    if variant=='ring':
        extra,bb=ring_dots(info, color=mono or KESAR); bx=[min(bx[0],bb[0]),min(bx[1],bb[1]),max(bx[2],bb[2]),max(bx[3],bb[3])]
    vb=(bx[0]-pad,-(bx[3]+pad),bx[2]-bx[0]+2*pad,bx[3]-bx[1]+2*pad)
    return vb, f'<g transform="scale(1,-1)">{extra}{body}{marks}</g>'
def latin_word(dark=False, staro=True):
    ink=GHEE if dark else NEEL
    L=LAT['manrope']; body=''
    for it in L['items']:
        b=it['bounds']
        if it['ch']=='o' and staro:
            cx=it['x']+(b[0]+b[2])/2; cy=it['y']+(b[1]+b[3])/2; R=(b[3]-b[1])/2*1.22
            body+=star(cx,cy,R,KESAR,ink if not dark else NEEL,dotr=10); continue
        body+=f'<path d="{it["d"]}" transform="translate({it["x"]} {it["y"]})" fill="{ink}"/>'
    x0,y0,x1,y1=L['bounds']; return (x0-20,-(y1+20),x1-x0+40,y1-y0+40), f'<g transform="scale(1,-1)">{body}</g>'
def svgdoc(vbg, w=None, h=None, bg=None):
    vb,g=vbg; size=(f' width="{w}"' if w else '')+(f' height="{h}"' if h else '')
    rect=f'<rect x="{vb[0]:.0f}" y="{vb[1]:.0f}" width="{vb[2]:.0f}" height="{vb[3]:.0f}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg"{size} viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}">{rect}{g}</svg>'
TAG=json.load(open('tagline.json'))
def tag_svg(x, y, w, color):
    x0,y0,x1,y1=TAG['bounds']; sc=w/(x1-x0); h=(y1-y0)*sc
    g=''.join(f'<path d="{it["d"]}" transform="translate({it["x"]} {it["y"]})"/>' for it in TAG['items'])
    return f'<svg x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{h:.0f}" viewBox="{x0:.0f} {-y1:.0f} {x1-x0:.0f} {y1-y0:.0f}"><g transform="scale(1,-1)" fill="{color}">{g}</g></svg>'
def lockup(dark=False):
    """horizontal: mark on the right (Urdu reads first), Pohnch and the line on the left"""
    mvb,mg=mark('ring',dark); lvb,lg=latin_word(dark)
    mh=mvb[3]; lw_scale=(mh*0.30)/lvb[3]
    W_=lvb[2]*lw_scale; gap=mh*0.10
    tot_w=W_+gap+mvb[2]
    ink=GHEE if dark else NEEL; sub=KESAR
    g=(f'<g transform="translate({-lvb[0]*lw_scale:.0f} {mh*0.30-lvb[3]*lw_scale+(-lvb[1])*lw_scale+mh*0.0:.0f}) scale({lw_scale:.4f})">'
       f'<g transform="translate(0 0)">{lg}</g></g>')
    # simpler: place both via nested svgs
    out=(f'<svg x="0" y="{mh*0.28:.0f}" width="{W_:.0f}" height="{mh*0.30:.0f}" viewBox="{lvb[0]:.0f} {lvb[1]:.0f} {lvb[2]:.0f} {lvb[3]:.0f}">{lg}</svg>'
         + tag_svg(W_*0.012, mh*0.64, W_*0.93, sub) +
         f'<svg x="{W_+gap:.0f}" y="0" width="{mvb[2]:.0f}" height="{mh:.0f}" viewBox="{mvb[0]:.0f} {mvb[1]:.0f} {mvb[2]:.0f} {mvb[3]:.0f}">{mg}</svg>')
    return (0,0,tot_w,mh), out
