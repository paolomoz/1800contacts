import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'fs';
const [src,out,y0,y1]=process.argv.slice(2);
const img=PNG.sync.read(readFileSync(src));
const Y0=+y0,Y1=Math.min(+y1,img.height),h=Y1-Y0;
const o=new PNG({width:img.width,height:h});
img.data.copy(o.data,0,Y0*img.width*4,Y1*img.width*4);
writeFileSync(out,PNG.sync.write(o));
console.log(`${out} ${img.width}x${h}`);
