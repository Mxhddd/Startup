import json, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.recordingPen import DecomposingRecordingPen as _DRP
RecordingPen=None
from fontTools.pens.boundsPen import BoundsPen
from shape import shape
FONTS = {'nastaliq':'NotoNastaliqUrdu-Bold.ttf','naskh':'NotoNaskhArabic-Bold.ttf','kufi':'ReemKufi-Bold.ttf','gulzar':'Gulzar-Regular.ttf'}
DOTWORDS=('dot','Dot')
out={}
for key,f in FONTS.items():
    path='fonts/'+f; tt=TTFont(path); gs=tt.getGlyphSet(); upm=tt['head'].unitsPerEm
    glyphs=shape(path,'پہنچ')
    base=[]; dots=[]
    for name,cl,x,y,adv in glyphs:
        if name=='sp0': continue
        rp=_DRP(gs); gs[name].draw(rp)
        is_dot = adv==0 and (any(w in name for w in DOTWORDS) or (key=='gulzar' and cl in (0,2,3)))
        
        if is_dot:
            # split contours -> each nuqta
            cur=[]; conts=[]
            for op,args in rp.value:
                cur.append((op,args))
                if op in ('closePath','endPath'): conts.append(cur); cur=[]
            for c in conts:
                bp=BoundsPen(gs); 
                for op,args in c: getattr(bp,op)(*args)
                if bp.bounds is None: continue
                x0,y0,x1,y1=bp.bounds
                dots.append({'cl':cl,'cx':x+(x0+x1)/2,'cy':y+(y0+y1)/2,'r':max(x1-x0,y1-y0)/2})
        else:
            sp=SVGPathPen(gs); gs[name].draw(sp)
            base.append({'d':sp.getCommands(),'x':x,'y':y,'name':name})
    # overall bounds of base
    xs=[];ys=[]
    for b in base:
        bp=BoundsPen(gs); gs[b['name']].draw(bp)
        if bp.bounds: x0,y0,x1,y1=bp.bounds; xs+=[b['x']+x0,b['x']+x1]; ys+=[b['y']+y0,b['y']+y1]
    for d in dots: xs+=[d['cx']-d['r'],d['cx']+d['r']]; ys+=[d['cy']-d['r'],d['cy']+d['r']]
    out[key]={'upm':upm,'base':base,'dots':dots,'bounds':[min(xs),min(ys),max(xs),max(ys)]}
    print(key, 'base',len(base),'dots',[(d['cl'],round(d['cx']),round(d['cy']),round(d['r'])) for d in dots])
json.dump(out,open('word.json','w'))

lat={}
for key,f in {'kufi':'ReemKufi-Bold.ttf','manrope':'Manrope-ExtraBold.ttf'}.items():
    path='fonts/'+f; tt=TTFont(path); gs=tt.getGlyphSet()
    g=shape(path,'Pohnch'); items=[]; xs=[];ys=[]
    for name,cl,x,y,adv in g:
        sp=SVGPathPen(gs); gs[name].draw(sp); bp=BoundsPen(gs); gs[name].draw(bp); b=bp.bounds
        items.append({'d':sp.getCommands(),'x':x,'y':y,'adv':adv,'bounds':b,'ch':'Pohnch'[cl] if cl<6 else ''})
        if b: xs+=[x+b[0],x+b[2]]; ys+=[y+b[1],y+b[3]]
    lat[key]={'items':items,'bounds':[min(xs),min(ys),max(xs),max(ys)],'xh':tt['OS/2'].sxHeight,'cap':tt['OS/2'].sCapHeight}
    print(key,'latin',[ (i['ch'],i['x']) for i in items], 'xh',lat[key]['xh'])
json.dump(lat,open('latin.json','w'))
