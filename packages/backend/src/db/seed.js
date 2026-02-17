import db, { initDatabase } from './database.js';

// Initialize database
initDatabase();

// Skills are registry-only references: source files stay on GitHub and are never mirrored locally.
const demoSkills = [
  {
    name: 'gmail-reader',
    version: '1.0.0',
    description: 'Read and analyze Gmail emails with AI-powered filtering and search.',
    author: 'OSMAgent Community',
    repository: 'https://github.com/osmagent/gmail-reader',
    ai_verified: 1,
    permissions: JSON.stringify(['gmail.read', 'gmail.search', 'gmail.labels']),
    entrypoint: 'index.js',
    dependencies: JSON.stringify({ googleapis: '^118.0.0' }),
    category: 'productivity'
  },
  {
    name: 'budget-analyzer',
    version: '1.0.0',
    description: 'Analyze CSV transactions and generate spending insights.',
    author: 'OSMAgent Community',
    repository: 'https://github.com/osmagent/budget-analyzer',
    ai_verified: 1,
    permissions: JSON.stringify(['finance.read', 'filesystem.read']),
    entrypoint: 'index.js',
    dependencies: JSON.stringify({ csv: '^6.3.0', lodash: '^4.17.21' }),
    category: 'finance'
  },
  {
    name: 'news-digest',
    version: '1.0.0',
    description: 'Build a daily digest from trusted RSS and API sources.',
    author: 'OSMAgent Community',
    repository: 'https://github.com/osmagent/news-digest',
    ai_verified: 1,
    permissions: JSON.stringify(['web.fetch', 'feeds.read']),
    entrypoint: 'digest.js',
    dependencies: JSON.stringify({ rss: '^1.2.2', axios: '^1.6.2' }),
    category: 'news'
  }
];

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

console.log(`✓ Seeded ${demoSkills.length} skills from GitHub registry references`);
demoSkills.forEach(skill => {
  console.log(`  - ${skill.name}: ${skill.description}`);
});
console.log('Database ready!');
