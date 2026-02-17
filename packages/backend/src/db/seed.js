import db, { initDatabase } from './database.js';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
initDatabase();

// Read SKILL.md files from skills directory
const skillsDir = path.join(__dirname, '../../../../skills');
const skillFolders = fs.readdirSync(skillsDir).filter(name => {
  const fullPath = path.join(skillsDir, name);
  return fs.statSync(fullPath).isDirectory();
});

const demoSkills = [];

for (const folder of skillFolders) {
  const skillPath = path.join(skillsDir, folder, 'SKILL.md');
  
  if (!fs.existsSync(skillPath)) {
    console.warn(`⚠️  No SKILL.md found in ${folder}`);
    continue;
  }

  const fileContent = fs.readFileSync(skillPath, 'utf-8');
  const { data, content: markdown } = matter(fileContent);
  
  // Extract metadata from markdown content
  const permissionsMatch = markdown.match(/## Permissions Required\n\n([\s\S]*?)(?=\n##|\n---|\z)/i);
  const permissions = [];
  if (permissionsMatch) {
    const permSection = permissionsMatch[1];
    const permMatches = permSection.matchAll(/`([^`]+)`/g);
    for (const match of permMatches) {
      permissions.push(match[1]);
    }
  }
  
  // Extract dependencies from npm install command
  const depsMatch = markdown.match(/npm install\s+([^\n]+)/);
  const dependencies = {};
  if (depsMatch) {
    const packages = depsMatch[1].split(/\s+/).filter(p => p && !p.startsWith('-'));
    packages.forEach(pkg => {
      const [name, version] = pkg.split('@');
      if (name && name !== 'npm') {
        // Remove the ^ prefix if already present in the version
        const cleanVersion = version && version.startsWith('^') ? version.slice(1) : version;
        dependencies[name] = cleanVersion ? `^${cleanVersion}` : 'latest';
      }
    });
  }
  
  // Determine category from permissions or content
  let category = 'utility';
  if (permissions.some(p => p.includes('email') || p.includes('gmail'))) category = 'productivity';
  if (permissions.some(p => p.includes('finance'))) category = 'finance';
  if (permissions.some(p => p.includes('feeds') || p.includes('news'))) category = 'news';
  
  demoSkills.push({
    name: data.name || folder,
    version: '1.0.0',
    description: data.description || 'No description',
    author: 'OSMAgent Community',
    repository: `https://github.com/osmagent/${data.name || folder}`,
    ai_verified: 1,
    permissions: JSON.stringify(permissions),
    entrypoint: 'index.js',
    dependencies: JSON.stringify(dependencies),
    category: category
  });
}

const insertSkill = db.prepare(`
  INSERT OR REPLACE INTO skills 
  (name, version, description, author, repository, ai_verified, permissions, entrypoint, dependencies, category)
  VALUES (@name, @version, @description, @author, @repository, @ai_verified, @permissions, @entrypoint, @dependencies, @category)
`);

const insertMany = db.transaction((skills) => {
  for (const skill of skills) {
    insertSkill.run(skill);
  }
});

insertMany(demoSkills);

console.log(`✓ Seeded ${demoSkills.length} skills from SKILL.md files`);
demoSkills.forEach(skill => {
  console.log(`  - ${skill.name}: ${skill.description}`);
});
console.log('Database ready!');

