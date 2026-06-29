const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/thailand-paths.ts'), 'utf8');

// Parse THAILAND_PATHS manually from the TS content
// The format is:
//   {
//     "id": "bkk",
//     "nameEn": "Bangkok",
//     "d": "..."
//   }
const paths = [];
const provinceBlocks = content.split('{\n    "id"');
provinceBlocks.shift(); // remove header

provinceBlocks.forEach(block => {
  const idMatch = block.match(/:\s*"([^"]+)"/);
  const id = idMatch ? idMatch[1] : '';
  
  const nameMatch = block.match(/"nameEn":\s*"([^"]+)"/);
  const nameEn = nameMatch ? nameMatch[1] : '';
  
  const dMatch = block.match(/"d":\s*"([^"]+)"/);
  const d = dMatch ? dMatch[1] : '';
  
  if (id && d) {
    paths.push({ id, nameEn, d });
  }
});

const DEFAULT_POINTERS = [
  { repName: 'นิตย์', anchorX: 130, anchorY: 260 },
  { repName: 'ดั๊ม', anchorX: 200, anchorY: 200 },
  { repName: 'โย', anchorX: 380, anchorY: 260 },
  { repName: 'ต้อ', anchorX: 390, anchorY: 480 },
  { repName: 'นุ', anchorX: 240, anchorY: 470 },
  { repName: 'เมฆ', anchorX: 300, anchorY: 600 },
  { repName: 'หรั่ง', anchorX: 250, anchorY: 540 },
  { repName: 'บังเซ็ง', anchorX: 160, anchorY: 680 },
  { repName: 'ใหญ่', anchorX: 200, anchorY: 880 }
];

paths.forEach(prov => {
  const coords = [];
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  const matches = prov.d.match(regex) || [];
  for (let i = 0; i < matches.length; i += 2) {
    if (i + 1 < matches.length) {
      const x = parseFloat(matches[i]);
      const y = parseFloat(matches[i+1]);
      // SVG path commands can contain absolute coords
      coords.push({ x, y });
    }
  }
  prov.coords = coords;
});

DEFAULT_POINTERS.forEach(ptr => {
  let minDistance = Infinity;
  let closestProv = null;
  
  paths.forEach(prov => {
    prov.coords.forEach(pt => {
      const dx = pt.x - ptr.anchorX;
      const dy = pt.y - ptr.anchorY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestProv = prov;
      }
    });
  });
  
  console.log(`Rep: ${ptr.repName} (Anchor: ${ptr.anchorX}, ${ptr.anchorY}) is closest to Province: ${closestProv ? closestProv.nameEn : 'Unknown'} (${closestProv ? closestProv.id : ''}) distance: ${minDistance.toFixed(2)}`);
});
