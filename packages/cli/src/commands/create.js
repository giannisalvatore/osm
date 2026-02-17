import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createCommand(skillName) {
  console.log(chalk.blue(`\n🚀 Creating new skill: ${skillName}\n`));

  try {
    // Interactive prompts for skill metadata
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Skill description:',
        validate: (input) => input.length > 10 || 'Description must be at least 10 characters'
      },
      {
        type: 'checkbox',
        name: 'permissions',
        message: 'Required permissions (select with space):',
        choices: [
          { name: 'read_email - Email access', value: 'read_email' },
          { name: 'read_finance - Financial data', value: 'read_finance' },
          { name: 'read_calendar - Calendar access', value: 'read_calendar' },
          { name: 'internet_access - Network access', value: 'internet_access' },
          { name: 'read_feeds - RSS feeds', value: 'read_feeds' },
          { name: 'file_system - File system access', value: 'file_system' }
        ]
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: 'OSMAgent Community'
      },
      {
        type: 'input',
        name: 'repository',
        message: 'GitHub repository URL (optional):',
        default: `https://github.com/osmagent/${skillName}`
      },
      {
        type: 'confirm',
        name: 'createStructure',
        message: 'Create full folder structure (references, scripts, assets)?',
        default: true
      }
    ]);

    // Create local skill directory
    const skillDir = path.join(process.cwd(), skillName);
    
    if (fs.existsSync(skillDir)) {
      console.log(chalk.red(`\n❌ Directory ${skillName}/ already exists`));
      return;
    }

    const spinner = ora('Creating skill structure...').start();

    // Create base directory
    fs.mkdirSync(skillDir);

    // Generate SKILL.md
    const skillMd = generateSkillMd(skillName, answers);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillMd);

    // Create index.js
    const indexJs = generateIndexJs(skillName);
    fs.writeFileSync(path.join(skillDir, 'index.js'), indexJs);

    // Create full structure if requested
    if (answers.createStructure) {
      fs.mkdirSync(path.join(skillDir, 'references'));
      fs.mkdirSync(path.join(skillDir, 'scripts'));
      fs.mkdirSync(path.join(skillDir, 'assets'));

      // Create reference docs
      fs.writeFileSync(
        path.join(skillDir, 'references', 'README.md'),
        `# ${skillName} References\n\nAdd your API documentation, guides, and reference materials here.`
      );

      // Create setup script
      fs.writeFileSync(
        path.join(skillDir, 'scripts', 'setup.sh'),
        `#!/bin/bash\n# Setup script for ${skillName}\necho "Setting up ${skillName}..."\n`
      );
      fs.chmodSync(path.join(skillDir, 'scripts', 'setup.sh'), '755');
    }

    // Create README
    const readmeMd = generateReadme(skillName, answers);
    fs.writeFileSync(path.join(skillDir, 'README.md'), readmeMd);

    spinner.succeed('Skill structure created!');

    console.log(chalk.green(`\n✓ Created ${skillName}/ with:`));
    console.log(`  - SKILL.md (OpenSkills format)`);
    console.log(`  - index.js (entry point)`);
    console.log(`  - README.md`);
    if (answers.createStructure) {
      console.log(`  - references/`);
      console.log(`  - scripts/`);
      console.log(`  - assets/`);
    }

    console.log(chalk.blue(`\n🎉 Skill created successfully at ./${skillName}/`));
    console.log(chalk.gray(`\nNext steps:`));
    console.log(chalk.gray(`  1. cd ${skillName}`));
    console.log(chalk.gray(`  2. Implement your skill logic in index.js`));
    console.log(chalk.gray(`  3. Add documentation to references/`));
    console.log(chalk.gray(`  4. Run: osm publish ./${skillName}`));

  } catch (error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

function generateSkillMd(name, metadata) {
  const permissionsSection = metadata.permissions.length > 0
    ? `\n## Permissions Required\n\n${metadata.permissions.map(p => `- \`${p}\` - Required for skill operation`).join('\n')}`
    : '';

  return `---
name: ${name}
description: ${metadata.description}
---

# ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Skill Instructions

When the user asks you to use this skill, follow these steps:

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Configure the skill (see references/ for details)

## Operations

### Basic Usage
\`\`\`javascript
const result = await execute('main');
console.log(result);
\`\`\`

### Advanced Usage
Add your specific operations here.
${permissionsSection}

## Important Notes

- This skill is currently in development
- See README.md for complete documentation
- Contributions welcome!
`;
}

function generateIndexJs(name) {
  return `/**
 * ${name} - OSMAgent Skill
 * 
 * Main entry point for the skill.
 */

export async function execute(operation, options = {}) {
  console.log(\`Executing ${name}: \${operation}\`);
  
  switch (operation) {
    case 'main':
      return await main(options);
    
    default:
      throw new Error(\`Unknown operation: \${operation}\`);
  }
}

async function main(options) {
  // TODO: Implement your main skill logic here
  return {
    success: true,
    message: '${name} executed successfully',
    data: options
  };
}

export default {
  execute
};
`;
}

function generateReadme(name, metadata) {
  const titleCase = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  
  return `# ${titleCase}

${metadata.description}

## Installation

\`\`\`bash
osm install ${name}
\`\`\`

## Usage

\`\`\`javascript
import ${name.replace(/-/g, '')} from '${name}';

const result = await ${name.replace(/-/g, '')}.execute('main');
console.log(result);
\`\`\`

## Permissions

${metadata.permissions.length > 0 
  ? metadata.permissions.map(p => `- \`${p}\``).join('\n')
  : 'No special permissions required'}

## Development

1. Clone the skill
2. Install dependencies: \`npm install\`
3. Implement logic in \`index.js\`
4. Test locally
5. Publish: \`osm publish ${name}\`

## License

MIT

## Author

${metadata.author}

## Repository

${metadata.repository}
`;
}

export default {
  createCommand
};
