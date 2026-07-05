import * as fs from 'fs';

let lines = fs.readFileSync('app/pt/page.tsx', 'utf8').split('\n');

lines.splice(169, 11);

fs.writeFileSync('app/pt/page.tsx', lines.join('\n'), 'utf8');
console.log("Fixed lines");
