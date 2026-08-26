import { chromium } from 'playwright';
const url = process.argv[2] || 'http://localhost:8791/index-proposed.html';
const b = await chromium.launch();
const p = await b.newPage();
await p.setViewportSize({ width: 360, height: 900 });
await p.goto(url, { waitUntil: 'networkidle' });
const rows = await p.evaluate(() => {
  const secs = [['promo','.promo'],['header','.hdr'],['search','.m-search'],['hero','.hero'],
    ['ins','.ins'],['cards','.cards-sec'],['steps','.steps-sec'],['reviews','.rev-sec'],
    ['faq','.faq-sec'],['footer','.ft']];
  return secs.map(([n,s])=>{const el=document.querySelector(s);if(!el)return[n,null,null];
    const r=el.getBoundingClientRect();return [n, Math.round(r.top+scrollY), Math.round(r.height)];});
});
for (const [n,top,h] of rows) console.log(`${n.padEnd(8)} top=${String(top).padStart(4)}  h=${h}`);
await b.close();
