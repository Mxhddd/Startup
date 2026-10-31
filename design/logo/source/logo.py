import json
W=json.load(open('word.json')); LAT=json.load(open('latin.json'))
STAR='M32 4 L40.2 12.2 L51.8 12.2 L51.8 23.8 L60 32 L51.8 40.2 L51.8 51.8 L40.2 51.8 L32 60 L23.8 51.8 L12.2 51.8 L12.2 40.2 L4 32 L12.2 23.8 L12.2 12.2 L23.8 12.2 Z'
NEEL='#1F2A5C'; KESAR='#E8A33D'; ZAM='#17705A'; GHEE='#FAF6EE'; PISTA='#A7D47E'; INK='#141A33'
def dots_of(key):
    out={}
    for d in W[key]['dots']:
        cl=d['cl']; lst=out.setdefault(cl,[])
        if key in ('nastaliq','gulzar') and cl in (0,3) and d['r']>120:
            r=d['r']; lst += [{'cx':d['cx']-r/2,'cy':d['cy'],'r':r/2},{'cx':d['cx']+r/2,'cy':d['cy'],'r':r/2}]
        else: lst.append(dict(d))
    return out
def star(cx,cy,R,fill,dot,dotr=9):
    k=R/28.0
    return f'<g transform="translate({cx-32*k:.1f} {cy-32*k:.1f}) scale({k:.4f})"><path d="{STAR}" fill="{fill}"/><circle cx="32" cy="32" r="{dotr}" fill="{dot}"/></g>'
def urdu(key, mode, ink=NEEL, dotc=KESAR, home=ZAM, starfill=KESAR, stardot=NEEL, chec=None, starscale=2.3, pad=60):
    F=W[key]; D=dots_of(key); body=''
    for b in F['base']: body+=f'<path d="{b["d"]}" transform="translate({b["x"]} {b["y"]})" fill="{ink}"/>'
    seq=[]
    for cl in (0,2,3): seq+=[(cl,d) for d in sorted(D.get(cl,[]), key=lambda d:-d['cx'])]
    import math
    md=min(math.hypot(a['cx']-b['cx'],a['cy']-b['cy']) for (_,a) in seq for (_,b) in seq if a is not b)
    rr=min(max(d['r'] for _,d in seq)*1.08, md/2*0.86)
    star_idx=len(seq)-1 if mode=='route' else [n for n,(cl,_) in enumerate(seq) if cl==2][0]
    marks=''; xs=[];ys=[]
    for n,(cl,d) in enumerate(seq):
        if n==star_idx:
            R=rr*starscale; marks+=star(d['cx'],d['cy'],R,starfill,stardot); xs+=[d['cx']-R*1.05,d['cx']+R*1.05]; ys+=[d['cy']-R*1.05,d['cy']+R*1.05]; continue
        c = home if n==0 else (chec if (chec and cl==3) else dotc)
        marks+=f'<circle cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="{rr:.1f}" fill="{c}"/>'
        xs+=[d['cx']-rr,d['cx']+rr]; ys+=[d['cy']-rr,d['cy']+rr]
    x0,y0,x1,y1=F['bounds']; x0=min(x0,*xs); x1=max(x1,*xs); y0=min(y0,*ys); y1=max(y1,*ys)
    vb=(x0-pad, -(y1+pad), x1-x0+2*pad, y1-y0+2*pad)
    return vb, f'<g transform="scale(1,-1)">{body}{marks}</g>'
def latin(key, ink=NEEL, starfill=None, stardot=KESAR, pad=40, starscale=1.2):
    L=LAT[key]; body=''; xs=[];ys=[]
    for it in L['items']:
        b=it['bounds']
        if it['ch']=='o':
            cx=it['x']+(b[0]+b[2])/2; cy=it['y']+(b[1]+b[3])/2; R=(b[3]-b[1])/2*starscale
            body+=star(cx,cy,R,starfill or ink,stardot,dotr=10); continue
        body+=f'<path d="{it["d"]}" transform="translate({it["x"]} {it["y"]})" fill="{ink}"/>'
    x0,y0,x1,y1=L['bounds']
    return (x0-pad, -(y1+pad), x1-x0+2*pad, y1-y0+2*pad), f'<g transform="scale(1,-1)">{body}</g>'
def svg(vbg, h=None, w=None, cls=''):
    vb,g=vbg; size=(f'height="{h}"' if h else '')+(f' width="{w}"' if w else '')
    return f'<svg class="{cls}" {size} viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" xmlns="http://www.w3.org/2000/svg">{g}</svg>'
