const fs = require('fs');
const path = require('path');

const utilsPath = path.join(__dirname, '../src/lib/utils.ts');
const utilsDir = path.dirname(utilsPath);

if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

if (!fs.existsSync(utilsPath)) {
  fs.writeFileSync(
    utilsPath,
    'export function cn(...classes: string[]) { return classes.filter(Boolean).join(" "); }'
  );
  console.log('Created src/lib/utils.ts');
} else {
  console.log('src/lib/utils.ts already exists');
} 