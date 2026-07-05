import * as fs from 'fs';

let content = fs.readFileSync('app/pt/page.tsx', 'utf8');

// 1. Remove from imports
content = content.replace(/useSearchUnassignedMembers, useAssignMember, /, '');

// 2. Remove state
content = content.replace(/const \[isAddOpen, setIsAddOpen\] = useState\(false\);\n/, '');

// 3. Remove search & assign unassigned members hook
const hookRegex = /\/\* —— Search & Assign Unassigned Members —— \*\/[\s\S]*?const assignMemberMutation = useAssignMember\(\);\n/;
content = content.replace(hookRegex, '');

// 4. Remove Add Client button
const btnRegex = /<button\s+onClick=\{\(\) => setIsAddOpen\(true\)\}[\s\S]*?\{t\("addClient"\)\}\n\s*<\/button>\n/;
content = content.replace(btnRegex, '');

// 5. Remove Add Client card in carousel
const cardRegex = /\{\/\* Add Client card \*\/\}\s*<button\s+onClick=\{\(\) => setIsAddOpen\(true\)\}[\s\S]*?<span className="text-xs font-medium" style=\{\{ color: "#7CFC00" \}\}>\{t\("addNew"\)\}<\/span>\s*<\/button>\n/;
content = content.replace(cardRegex, '');

// 6. Remove the modal
const modalRegex = /\{\/\* ══ ASSIGN CLIENT MODAL ══ \*\/\}\s*<AnimatePresence>[\s\S]*?isAddOpen[\s\S]*?<\/AnimatePresence>\n/;
content = content.replace(modalRegex, '');

fs.writeFileSync('app/pt/page.tsx', content, 'utf8');
console.log("Done");
