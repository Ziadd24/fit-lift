import * as fs from 'fs';

let lines = fs.readFileSync('app/pt/page.tsx', 'utf8').split('\n');

// The assignment modal is from lines 981 to 1025, which corresponds to index 980 to 1024
lines.splice(980, 45); // Removes 981 to 1025 inclusive

fs.writeFileSync('app/pt/page.tsx', lines.join('\n'), 'utf8');
console.log("Fixed modal");
