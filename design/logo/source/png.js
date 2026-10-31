// renders every SVG in kit7 to a transparent PNG, 2400 px on the long side (app icon 1024)
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
for(const f of fs.readdirSync('kit7').filter(f=>f.endsWith('.svg'))){
  const svg=fs.readFileSync('kit7/'+f,'utf8');
  const vb=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
  let L=f.includes('app-icon')?1024:(f.includes('star')?512:2400);
  const w=vb[2]>=vb[3]?L:Math.round(L*vb[2]/vb[3]), h=vb[2]>=vb[3]?Math.round(L*vb[3]/vb[2]):L;
  await p.setViewportSize({width:w,height:h});
  await p.setContent(`<style>html,body{margin:0;background:transparent}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${w}" height="${h}" style="display:block">`);
  await p.waitForTimeout(80);
  await p.screenshot({path:'kit7/'+f.replace('.svg','.png'),omitBackground:true});
}
await b.close();})();
