const fs = require('fs');
const path = require('path');

const content = fs.readFileSync(path.join(__dirname, '../src/thailand-paths.ts'), 'utf8');

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

const centers = {};

paths.forEach(prov => {
  const regex = /[-+]?[0-9]*\.?[0-9]+/g;
  const matches = prov.d.match(regex) || [];
  
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  // A simple absolute coordinate tracker
  let curX = 0;
  let curY = 0;
  
  // We can parse the SVG path command characters and numbers to build exact coordinates,
  // but for centroid calculation, just averaging all coordinates listed in the path is extremely close.
  // Let's implement a basic SVG path parser to get absolute coordinates:
  const commands = prov.d.match(/[a-zA-Z]|[-+]?[0-9]*\.?[0-9]+/g) || [];
  
  let i = 0;
  let cmd = '';
  while (i < commands.length) {
    const token = commands[i];
    if (/[a-zA-Z]/.test(token)) {
      cmd = token;
      i++;
    } else {
      // It's a coordinate number. Depending on cmd, parse numbers.
      // E.g. 'm' or 'l' is dx, dy. 'M' or 'L' is x, y.
      if (cmd === 'm' || cmd === 'l') {
        const dx = parseFloat(commands[i]);
        const dy = parseFloat(commands[i+1]);
        curX += dx;
        curY += dy;
        sumX += curX;
        sumY += curY;
        count++;
        i += 2;
      } else if (cmd === 'M' || cmd === 'L') {
        const x = parseFloat(commands[i]);
        const y = parseFloat(commands[i+1]);
        curX = x;
        curY = y;
        sumX += curX;
        sumY += curY;
        count++;
        i += 2;
      } else {
        // Other command coordinates, just skip or handle loosely
        i++;
      }
    }
  }
  
  if (count > 0) {
    centers[prov.id] = {
      x: Math.round(sumX / count),
      y: Math.round(sumY / count)
    };
  } else {
    // Fallback to simple average of all matches if no M/m/L/l parsed
    let simpleSumX = 0, simpleSumY = 0, simpleCount = 0;
    for (let j = 0; j < matches.length; j += 2) {
      if (j + 1 < matches.length) {
        simpleSumX += parseFloat(matches[j]);
        simpleSumY += parseFloat(matches[j+1]);
        simpleCount++;
      }
    }
    centers[prov.id] = {
      x: Math.round(simpleSumX / simpleCount),
      y: Math.round(simpleSumY / simpleCount)
    };
  }
});

console.log('// Copy this mapping to src/thailand-paths.ts or App.tsx');
console.log('export const PROVINCE_CENTERS: Record<string, { x: number; y: number }> = ' + JSON.stringify(centers, null, 2));
