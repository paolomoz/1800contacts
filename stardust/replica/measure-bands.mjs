import { PNG } from 'pngjs';
import { readFileSync } from 'fs';
const named = {
  mint:[0x99,0xdb,0xd8], navy:[0x00,0x13,0xa2], herowash:[0xdb,0xed,0xf7],
  inswhite:[0xfb,0xfc,0xff], fill:[0xde,0xf1,0xfa], white:[0xff,0xff,0xff],
  bluemid:[0x50,0x99,0xd3], navydeep:[0x00,0x00,0x83],
};
function classify(r,g,b){
  let best='?',bd=1e9;
  for(const[k,[R,G,B]]of Object.entries(named)){
    const d=(r-R)**2+(g-G)**2+(b-B)**2;
    if(d<bd){bd=d;best=k;}
  }
  return bd<1400?best:'?';
}
function bands(path){
  const img=PNG.sync.read(readFileSync(path));
  const {width,height,data}=img;
  const xs=[6,14,width-8]; // sample left margin + right edge
  const rows=[];
  for(let y=0;y<height;y++){
    // majority vote across sample columns
    const votes={};
    for(const x of xs){const i=(y*width+x)*4;const c=classify(data[i],data[i+1],data[i+2]);votes[c]=(votes[c]||0)+1;}
    let c='?',v=0;for(const[k,n]of Object.entries(votes))if(n>v){v=n;c=k;}
    rows.push(c);
  }
  // collapse into runs, merge tiny runs
  const runs=[];let cur=rows[0],start=0;
  for(let y=1;y<=height;y++){if(y===height||rows[y]!==cur){runs.push({c:cur,y0:start,y1:y,h:y-start});start=y;cur=rows[y];}}
  return runs.filter(r=>r.h>=25); // drop noise
}
for(const p of process.argv.slice(2)){
  console.log(`\n=== ${p} ===`);
  for(const r of bands(p))console.log(`  ${String(r.y0).padStart(5)}–${String(r.y1).padStart(5)}  h=${String(r.h).padStart(4)}  ${r.c}`);
}
