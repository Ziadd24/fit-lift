import * as fs from 'fs';

let content = fs.readFileSync('app/pt/page.tsx', 'utf8');

const regex = /\/\*[\s\S]*?const assignMemberMutation = useAssignMember\(\);\n/;
content = content.replace(regex, '');

fs.writeFileSync('app/pt/page.tsx', content, 'utf8');
console.log("Fixed");
