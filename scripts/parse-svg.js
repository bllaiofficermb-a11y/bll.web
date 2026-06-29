import fs from 'fs';

try {
  const svgContent = fs.readFileSync('node_modules/@svg-maps/thailand/thailand.svg', 'utf8');

  // Clean and prepare SVG string for flexible parsing
  const cleanSvg = svgContent.replace(/\s+/g, ' ');
  
  // Match path elements
  const pathRegex = /<path\s+id="([^"]+)"\s+aria-label="([^"]+)"\s+d="([^"]+)"\s*\/?>/g;

  const paths = [];
  let match;
  while ((match = pathRegex.exec(cleanSvg)) !== null) {
    paths.push({
      id: match[1],
      nameEn: match[2],
      d: match[3]
    });
  }

  // Fallback pattern if attributes order is: d, id, aria-label
  if (paths.length === 0) {
    const fallbackRegex = /<path\s+d="([^"]+)"\s+id="([^"]+)"\s+aria-label="([^"]+)"\s*\/?>/g;
    while ((match = fallbackRegex.exec(cleanSvg)) !== null) {
      paths.push({
        id: match[2],
        nameEn: match[3],
        d: match[1]
      });
    }
  }

  // Fallback pattern 3: more flexible matching using regex on individual matches
  if (paths.length === 0) {
    const rawPaths = svgContent.match(/<path[^>]+>/g) || [];
    for (const p of rawPaths) {
      const idMatch = p.match(/id="([^"]+)"/);
      const labelMatch = p.match(/aria-label="([^"]+)"/);
      const dMatch = p.match(/d="([^"]+)"/);
      if (idMatch && labelMatch && dMatch) {
        paths.push({
          id: idMatch[1],
          nameEn: labelMatch[1],
          d: dMatch[1]
        });
      }
    }
  }

  const fileContent = `export interface ThailandPath {
  id: string;
  nameEn: string;
  d: string;
}

export const THAILAND_PATHS: ThailandPath[] = ${JSON.stringify(paths, null, 2)};
`;

  fs.writeFileSync('src/thailand-paths.ts', fileContent);
  console.log('Successfully written ' + paths.length + ' paths to src/thailand-paths.ts');
} catch (error) {
  console.error('Error parsing SVG:', error);
  process.exit(1);
}
