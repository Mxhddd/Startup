import json, math
from logo import *
def parts(key, ink=NEEL, dotc=KESAR, home=ZAM, starfill=KESAR, stardot=NEEL, starscale=2.5, chedots=None):
    F=W[key]; D=dots_of(key); body=''
    for b in F['base']: body+=f'<path d="{b["d"]}" transform="translate({b["x"]} {b["y"]})" fill="{ink}"/>'
    seq=[]
    for cl in (0,2,3): seq+=[(cl,d) for d in sorted(D.get(cl,[]), key=lambda d:-d['cx'])]
    md=min(math.hypot(a['cx']-b['cx'],a['cy']-b['cy']) for (_,a) in seq for (_,b) in seq if a is not b)
    rr=min(max(d['r'] for _,d in seq)*1.0, md/2*0.86)
    marks=''; info={'rr':rr}
    for n,(cl,d) in enumerate(seq):
        if cl==2:
            R=rr*starscale; marks+=star(d['cx'],d['cy'],R,starfill,stardot); info['star']=(d['cx'],d['cy'],R); continue
        c = home if n==0 else (chedots if (chedots and cl==3) else dotc)
        if n==0: info['home']=(d['cx'],d['cy'])
        marks+=f'<circle cx="{d["cx"]:.1f}" cy="{d["cy"]:.1f}" r="{rr:.1f}" fill="{c}"/>'
    info['bounds']=F['bounds']
    return body, marks, info
def ring(info, color=KESAR, mode='dots', width=None):
    x0,y0,x1,y1=info['bounds']; H=y1-y0; w=x1-x0; g=0.13*H; rr=info['rr']
    hx,hy=info['home']; sx,sy,R=info['star']; mx=(x0+x1)/2
    p=[(hx,hy-rr*1.6),(mx,y0-g),(x0-g,(y0+y1)/2),(sx-R*1.15,sy-R*0.15)]
    c=[((hx+g*0.9,hy-(hy-(y0-g))*0.65),(mx+w*0.36,y0-g)),((mx-w*0.36,y0-g),(x0-g,y0+H*0.12)),((x0-g,(y0+y1)/2+H*0.33),(sx-R*3.2,sy+R*0.2))]
    d='M%.0f %.0f'%p[0]
    for (a,b),q in zip(c,p[1:]): d+=' C%.0f %.0f %.0f %.0f %.0f %.0f'%(a[0],a[1],b[0],b[1],q[0],q[1])
    if mode=='dots':
        return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width or rr*0.62:.0f}" stroke-linecap="round" stroke-dasharray="0.1 {rr*1.55:.0f}"/>', (x0-g*1.3, y0-g*1.3, x1+g*0.6, y1+g*0.4)
    # tapered brush: sample the curve and build a filled ribbon
    import itertools
    def bez(P0,P1,P2,P3,t): return tuple((1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t**2*cc+t**3*e for a,b,cc,e in zip(P0,P1,P2,P3))
    pts=[]
    segs=[(p[0],c[0][0],c[0][1],p[1]),(p[1],c[1][0],c[1][1],p[2]),(p[2],c[2][0],c[2][1],p[3])]
    for si,sg in enumerate(segs):
        for k in range(40):
            pts.append(bez(*sg,k/40))
    pts.append(p[3])
    N=len(pts); T=width or rr*1.15; L=[];Rr=[]
    for k,q in enumerate(pts):
        a=pts[max(0,k-1)]; b=pts[min(N-1,k+1)]; dx,dy=b[0]-a[0],b[1]-a[1]; ln=math.hypot(dx,dy) or 1; nx,ny=-dy/ln,dx/ln
        s=k/(N-1); t=T*(math.sin(math.pi*min(1,s*1.25))**0.8)*(1-s)**0.35
        L.append((q[0]+nx*t/2,q[1]+ny*t/2)); Rr.append((q[0]-nx*t/2,q[1]-ny*t/2))
    poly=L+Rr[::-1]
    return '<path d="M'+' L'.join('%.0f %.0f'%q for q in poly)+' Z" fill="%s"/>'%color, (x0-g*1.3, y0-g*1.3, x1+g*0.6, y1+g*0.4)
def compose(key, variant, dark=False, h=None, pad=60):
    ink=GHEE if dark else NEEL; home=PISTA if dark else ZAM
    body,marks,info=parts(key,ink=ink,home=home)
    extra=''; bx=list(info['bounds'])
    sx,sy,R=info['star']; bx=[min(bx[0],sx-R),min(bx[1],sy-R),max(bx[2],sx+R),max(bx[3],sy+R)]
    if variant in ('ring','brush','seal'):
        e,bb=ring(info, mode='dots' if variant in ('ring','seal') else 'brush'); extra=e
        bx=[min(bx[0],bb[0]),min(bx[1],bb[1]),max(bx[2],bb[2]),max(bx[3],bb[3])]
    inner=f'<g transform="scale(1,-1)">{extra}{body}{marks}</g>'
    if variant=='seal':
        cx=(bx[0]+bx[2])/2; cy=-(bx[1]+bx[3])/2; r=max(bx[2]-bx[0],bx[3]-bx[1])/2*1.12
        inner=f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r:.0f}" fill="{NEEL if dark else GHEE}" stroke="{KESAR}" stroke-width="{r*0.025:.0f}"/><circle cx="{cx:.0f}" cy="{cy:.0f}" r="{r*0.93:.0f}" fill="none" stroke="{GHEE if dark else NEEL}" stroke-width="{r*0.012:.0f}"/>'+inner
        bx=[cx-r*1.05,-(cy+r*1.05),cx+r*1.05,-(cy-r*1.05)]
    vb=(bx[0]-pad,-(bx[3]+pad),bx[2]-bx[0]+2*pad,bx[3]-bx[1]+2*pad)
    size=f'height="{h}"' if h else ''
    return f'<svg {size} viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" xmlns="http://www.w3.org/2000/svg">{inner}</svg>'
if __name__=='__main__':
    rows=''
    for key in ('nastaliq','gulzar'):
        for v in ('crown','ring','brush','seal'):
            rows+=f'<div class="r"><b>{key} · {v}</b><div class="c">{compose(key,v,h=230)}</div><div class="c d">{compose(key,v,dark=True,h=230)}</div><div class="c s">{compose(key,v,h=44)}</div></div>'
    open('var.html','w').write('<meta charset=utf-8><body style="margin:0;background:#fff;font-family:sans-serif"><style>.r{display:flex;gap:16px;align-items:center;padding:8px 16px}.c{background:#FAF6EE;height:260px;width:420px;display:flex;align-items:center;justify-content:center;border-radius:14px}.d{background:#1F2A5C}.s{width:160px}b{width:150px}</style>'+rows)
