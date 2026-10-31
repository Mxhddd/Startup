import sys, json
sys.path.insert(0, '../logo')
import os
os.chdir('../logo')
from final import *
import final2
os.chdir('../posters')

import final2 as F2
def _d(g_bb, pad=60):
    g, bb = g_bb; return F2.doc(g, bb, pad)
LOGO = _d(F2.urdu_parts(NEEL, KESAR))
LOGO_DARK = _d(F2.urdu_parts(GHEE, KESAR))
COMPACT_DARK = LOGO_DARK
LOCKUP = _d(F2.lockup(NEEL, KESAR), 80)
LOCKUP_DARK = _d(F2.lockup(GHEE, KESAR), 80)
LATIN_DARK = _d(F2.latin_parts(GHEE, KESAR))
STARI = lambda s, f=KESAR, d=None: f'<svg width="{s}" height="{s}" viewBox="0 0 64 64" aria-hidden="true"><path d="{F2.star_d(32, 32, 28)}" fill="{f}" fill-rule="evenodd"/></svg>'
CHAT = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 4C13 4 4 12.3 4 22.6c0 5.4 2.5 10.2 6.5 13.6L8.6 44l8.6-4.4c2.1.6 4.4 1 6.8 1 11 0 20-8.3 20-18.6S35 4 24 4z" fill="currentColor"/><path d="M17.2 15.5c.5-1.1 1.6-1.2 2.1-.2l2 4c.3.7.2 1.4-.3 1.9l-1.2 1.3c1.3 2.6 3.4 4.7 6 6l1.3-1.2c.5-.5 1.3-.6 1.9-.3l4 2c1 .5.9 1.6-.2 2.1-2.5 1.4-5.4 1-8.7-1.2-3.1-2-5.6-4.6-7.6-7.6-2.2-3.4-2.6-6.3-1.3-8.8z" fill="#FAF6EE"/></svg>'
PHONE_NO = '0300 1478729'

ROUTE_BG = '''<svg class="routebg" viewBox="0 0 400 400" preserveAspectRatio="none" aria-hidden="true"><path d="M30 360 C 120 300, 60 200, 170 170 S 330 120, 370 40" fill="none" stroke="#E8A33D" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="0.1 11"/></svg>'''

def phone_lock(time, notif_title, notif_body, la_min, la_text, extra=''):
    return f'''<div class="phone"><div class="ps lattice"><div class="di"></div>
      <div class="lk-time">{time}</div>
      <div class="nt"><div class="h">{STARI(13)}POHNCH<em>now</em></div><b>{notif_title}</b><span>{notif_body}</span></div>
      <div class="la"><div class="r"><span class="m">{la_min}</span><span class="t">{la_text}</span></div><div class="bar"><i></i><s></s></div></div>{extra}
    </div></div>'''

def phone_driver():
    return f'''<div class="phone"><div class="ps" style="background:#FAF6EE">
      <div class="di"></div>
      <div class="dhead"><b>صبح کا سفر</b><span>رفیق بھائی · 12 بچے</span></div>
      <div class="dlist"><div class="drow done"><i></i><b>وین نکل گئی</b><em>7:05</em></div>
      <div class="drow done"><i></i><b>حمزہ، عائشہ</b><em>7:09</em></div>
      <div class="dtap"><span class="ic"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#17705A" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span><b>علی بٹھا لیا</b><small>ایک سیکنڈ دبا کر رکھیں</small></span></div>
      <div class="drow"><i class="o"></i><b>بلال</b><em>اگلا</em></div>
      <div class="drow"><i class="o"></i><b>زینب</b><em></em></div></div>
    </div></div>'''

CSS = open('posters.css').read()

def page(cls, inner, w, h):
    return f'<section class="page {cls}" style="width:{w}mm;height:{h}mm" data-w="{w}" data-h="{h}">{inner}</section>'

def cta(big=True, dark=False):
    return f'''<div class="cta {'big' if big else ''} {'dark' if dark else ''}"><span class="chat">{CHAT}</span><div><span class="u lbl">واٹس ایپ کریں</span><b>{PHONE_NO}</b></div></div>'''

pages = []

# ---------- 1 · A3 school-gate poster ----------
pages.append(page('a3', f'''
  <div class="grid"></div>
  <header class="a3-top"><div class="mark">{LOGO}</div>
    <div class="a3-title"><span class="kicker mk">اسکول وین کے والدین کے لیے</span>
      <h1 class="nq">آپ کے بچے کی وین،<br><mark>آپ کے فون پر</mark></h1>
      <p class="u sub">نقشے پر وین چلتی دیکھیں · بچہ بیٹھے تو خبر · اسکول پہنچے تو خبر</p>
      <p class="en">Your child's school van, live on your phone. An alert when your child gets in, and when the van reaches school.</p></div>
  </header>
  <div class="a3-mid">
    <div class="steps">
      <div class="step"><span class="num">1</span><div><b class="u">ڈرائیور سفر شروع کرتے ہیں</b><span class="en">The driver starts the trip on the Pohnch Driver app.</span></div></div>
      <div class="step"><span class="num">2</span><div><b class="u">آپ نقشے پر وین دیکھتے ہیں</b><span class="en">You see the van moving, and the minutes to your door.</span></div></div>
      <div class="step"><span class="num">3</span><div><b class="u">بچہ بیٹھے، اسکول پہنچے: فوراً خبر</b><span class="en">An alert the moment your child is in, and at the school gate.</span></div></div>
      <div class="note mk">کوئی ڈبہ نہیں لگتا۔ ڈرائیور کا اپنا فون، صرف سفر کے دوران۔<br><span class="en">No box in the van: the driver's own phone, only during the trip.</span></div>
    </div>
    <div class="phonewrap">{ROUTE_BG}{phone_lock('7:12', 'رفیق بھائی نے مارک کیا', 'علی وین میں ہے · 7:12', '24 min', 'اسکول کی طرف')}</div>
  </div>
  <div class="offer"><div><b class="u">آزمائشی دور: بالکل مفت</b><span class="en">Free during the pilot · Your school's vans can join first</span></div>{cta(True, True)}</div>
  <footer class="foot"><span class="gz">فکر کم، خبر پوری</span><span class="en">Message “Pohnch” and your school's name.</span></footer>
''', 297, 420))

# ---------- 2 · A4 parent flyer, Urdu front ----------
pages.append(page('a4 flyer', f'''
  <div class="grid"></div>
  <header class="fl-top"><div class="mark sm">{LOGO}</div><div><span class="kicker mk">والدین کے لیے</span><h1 class="nq">وین کہاں ہے؟<br><mark>اب فون کی ضرورت نہیں</mark></h1></div></header>
  <div class="ba">
    <div class="card before"><span class="tag">آج</span><ul class="u"><li>دس گھرانے، ایک ڈرائیور کو فون</li><li>ڈرائیور گاڑی چلاتے ہوئے فون اٹھاتے ہیں</li><li>بچہ بیٹھا یا نہیں؟ کوئی خبر نہیں</li></ul></div>
    <div class="card after"><span class="tag">پہنچ کے ساتھ</span><ul class="u"><li>نقشے پر وین، دروازے تک کے منٹ</li><li>بچہ بیٹھے تو خبر، کس نے مارک کیا</li><li>اسکول پہنچے تو خبر</li><li>«آج چھٹی» ایک بٹن سے</li><li>گھر کے 4 لوگ ایک ساتھ دیکھیں</li></ul></div>
  </div>
  <div class="privacy u">صرف آپ کا بچہ، صرف آپ کی وین۔ مقام صرف سفر کے دوران، اور 30 دن بعد مٹ جاتا ہے۔ بچے کا صرف پہلا نام۔</div>
  <div class="join"><h2 class="u">شامل کیسے ہوں؟</h2>
    <div class="jsteps u"><div><span class="num">1</span>واٹس ایپ پر «پہنچ» اور اپنے اسکول کا نام بھیجیں</div><div><span class="num">2</span>ہم آپ کے وین ڈرائیور سے بات کریں گے</div><div><span class="num">3</span>آپ کو ایپ کا لنک ملے گا، اور وین نقشے پر</div></div></div>
  <div class="offer slim"><b class="u">آزمائشی دور میں بالکل مفت</b>{cta(False, True)}</div>
  <footer class="foot sm"><span class="gz">فکر کم، خبر پوری</span><span class="en">English on the back</span></footer>
''', 210, 297))

# ---------- 3 · A4 parent flyer, English back ----------
pages.append(page('a4 flyer en', f'''
  <div class="grid"></div>
  <header class="fl-top en-top"><div><span class="kicker mk">For parents</span><h1 class="lat">Where is the van?<br><mark>No more calling.</mark></h1></div><div class="mark sm">{LOGO}</div></header>
  <div class="ba">
    <div class="card before"><span class="tag lat">Today</span><ul class="lat"><li>Ten families call one driver</li><li>He answers while driving</li><li>Is my child in the van? No news</li></ul></div>
    <div class="card after"><span class="tag lat">With Pohnch</span><ul class="lat"><li>The van on a map, minutes to your door</li><li>An alert when your child gets in, with who marked it</li><li>An alert at the school gate</li><li>“Off today” in one tap</li><li>Up to 4 family members can follow</li></ul></div>
  </div>
  <div class="privacy lat">Only your child, only your van. Location only during the trip, deleted after 30 days. First names only.</div>
  <div class="join"><h2 class="lat">How to join</h2>
    <div class="jsteps lat"><div><span class="num">1</span>WhatsApp “Pohnch” and your school's name</div><div><span class="num">2</span>We talk to your van driver</div><div><span class="num">3</span>You get the app link, and the van on the map</div></div></div>
  <div class="offer slim"><b class="lat">Free during the pilot</b>{cta(False, True)}</div>
  <footer class="foot sm"><span class="gz">فکر کم، خبر پوری</span><span class="en">Less worry, the whole story</span></footer>
''', 210, 297))

# ---------- 4 · A4 driver poster ----------
pages.append(page('a4 driver', f'''
  <div class="grid"></div>
  <header class="fl-top"><div class="mark sm">{LOGO}</div><div><span class="kicker mk">وین ڈرائیور بھائیوں کے لیے</span><h1 class="nq">فون کم،<br><mark>سفر آسان</mark></h1></div></header>
  <div class="drv">
    <ul class="pts u">
      <li><span class="num"><svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EE" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b>پہنچ ڈرائیور ایپ بالکل مفت</b><span>کوئی ڈبہ، کوئی خرچ نہیں</span></div></li>
      <li><span class="num"><svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EE" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b>والدین نقشے پر خود دیکھ لیتے ہیں</b><span>«وین کہاں ہے؟» والے فون کم</span></div></li>
      <li><span class="num"><svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EE" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b>وین رکی ہو تو ایک بڑا بٹن</b><span>ہر بچے کے لیے ایک ٹیپ، بہن بھائی ایک ساتھ</span></div></li>
      <li><span class="num"><svg viewBox="0 0 24 24" fill="none" stroke="#FAF6EE" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><div><b>مقام صرف سفر کے دوران</b><span>سفر ختم، مقام بند</span></div></li>
      <li><span class="num soon">جلد</span><div><b>خالی سیٹیں نقشے سے بھریں، فیس وقت پر</b><span>آزمائشی دور کے بعد</span></div></li>
    </ul>
    <div class="phonewrap d">{phone_driver()}</div>
  </div>
  <div class="note2 mk">ہم خود آ کر ایپ لگائیں گے اور ایک پریکٹس چکر کروائیں گے۔<br><span class="en">We'll install it with you and do a practice run first.</span></div>
  <div class="offer slim"><b class="u">آزمائشی دور میں شامل ہوں</b>{cta(False, True)}</div>
  <footer class="foot sm"><span class="gz">فکر کم، خبر پوری</span><span class="en">For van drivers: free app, fewer calls.</span></footer>
''', 210, 297))

# ---------- 5 · A4 driver wallet cards (10 × 85 × 55 mm) ----------
card = f'''<div class="wcard"><div class="wl"><div class="mark xs">{LOGO_DARK}</div></div><div class="wr"><b class="u">پہنچ ڈرائیور · مفت</b>
  <ol class="u"><li>سفر شروع کریں</li><li>وین رکی ہو تو بچے پر ایک ٹیپ</li><li>اسکول پہنچ کر «پہنچ گئے»</li></ol>
  <span class="wa">{CHAT}<b>{PHONE_NO}</b></span></div></div>'''
pages.append(page('a4 cards', '<div class="cardgrid">' + card * 10 + '</div><p class="cut lat">Cut along the lines · 85 × 55 mm, the size of a wallet card</p>', 210, 297))

# ---------- 6 · A4 van stickers ----------
pages.append(page('a4 stickers', f'''
  <div class="stk big"><div class="mark">{LOGO_DARK}</div><div class="stxt"><b class="u">یہ وین پہنچ پر ہے</b><span class="u">والدین: وین لائیو دیکھیں</span><span class="lat">This van is on Pohnch · Parents can follow it live</span><span class="wa">{CHAT}<b>{PHONE_NO}</b></span></div></div>
  <div class="stkrow">
    <div class="stk small"><div class="mark">{COMPACT_DARK}</div><div class="stxt"><b class="u">پہنچ پر</b><span class="lat">On Pohnch</span></div></div>
    <div class="stk small light"><div class="mark">{LOGO}</div><div class="stxt"><b class="u">والدین</b><span class="lat">{PHONE_NO}</span></div></div>
  </div>
  <div class="stkrow">
    <div class="stk round"><div class="mark">{LOGO_DARK}</div></div>
    <div class="stk round light"><div class="mark">{LOGO}</div></div>
    <div class="stk round"><div class="lat-wrap">{LATIN_DARK}</div></div>
  </div>
  <p class="cut lat">Print on vinyl sticker paper · rear window 190 × 110 mm · door 90 × 60 mm · round 60 mm</p>
''', 210, 297))

html = f'''<!doctype html><html lang="ur"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gulzar&family=Manrope:wght@500;600;700;800&family=Noto+Nastaliq+Urdu:wght@700&family=Noto+Sans+Arabic:wght@500;600;700;800&family=Shantell+Sans:wght@600;700&display=swap">
<style>{CSS}</style></head><body>{''.join(pages)}</body></html>'''
open('posters.html', 'w').write(html)
print('pages', len(pages))
