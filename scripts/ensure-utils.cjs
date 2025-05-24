const fs = require('fs');
const path = require('path');

const utilsContent = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;

const utilsPath = path.join(process.cwd(), 'src', 'lib', 'utils.ts');

// Create directory if it doesn't exist
if (!fs.existsSync(path.dirname(utilsPath))) {
  fs.mkdirSync(path.dirname(utilsPath), { recursive: true });
}

// Create or update utils.ts
fs.writeFileSync(utilsPath, utilsContent);

console.log('Created src/lib/utils.ts'); 