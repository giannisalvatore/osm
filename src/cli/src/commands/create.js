import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { validateName, validateDescription } from '../utils/skillmd.js';

export async function createCommand(skillName) {
  const nameErr = validateName(skillName);
  if (nameErr) {
    console.log(chalk.red(`\n❌ Invalid skill name: ${nameErr}`));
    process.exit(1);
  }

  console.log(chalk.blue(`\nCreating new skill: ${skillName}\n`));

  try {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Description (1-1024 chars):',
        validate: (input) => validateDescription(input) || true
      },
      {
        type: 'input',
        name: 'license',
        message: 'License:',
        default: 'MIT'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author:'
      },
      {
        type: 'input',
        name: 'version',
        message: 'Version:',
        default: '1.0.0'
      }
    ]);

    const skillDir = path.join(process.cwd(), skillName);

    if (fs.existsSync(skillDir)) {
      console.log(chalk.red(`\n❌ Directory ${skillName}/ already exists`));
      return;
    }

    const spinner = ora('Creating skill...').start();

    fs.mkdirSync(skillDir);

    // Required: SKILL.md
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), generateSkillMd(skillName, answers));

    // Optional but always scaffolded: README.md
    fs.writeFileSync(path.join(skillDir, 'README.md'), generateReadme(skillName, answers));

    // Optional directories with example files
    fs.mkdirSync(path.join(skillDir, 'scripts'));
    fs.writeFileSync(
      path.join(skillDir, 'scripts', 'setup.sh'),
      `#!/bin/bash\n# Setup script for ${skillName}\n# Add any environment setup steps here\necho "${skillName} setup complete"\n`
    );
    fs.chmodSync(path.join(skillDir, 'scripts', 'setup.sh'), '755');

    fs.mkdirSync(path.join(skillDir, 'references'));
    fs.writeFileSync(
      path.join(skillDir, 'references', 'api-reference.md'),
      `# ${titleCase(skillName)} API Reference\n\nDocument the APIs, tools, or services this skill relies on.\n\n## Endpoints\n\n| Method | URL | Description |\n|--------|-----|-------------|\n| GET    | /example | Example endpoint |\n`
    );

    fs.mkdirSync(path.join(skillDir, 'assets'));
    fs.writeFileSync(
      path.join(skillDir, 'assets', '.gitkeep'),
      ''
    );

    spinner.succeed('Skill created!');

    console.log(chalk.green(`\n✓ Created ${skillName}/`));
    console.log(`  - SKILL.md`);
    console.log(`  - README.md`);
    console.log(`  - scripts/setup.sh`);
    console.log(`  - references/api-reference.md`);
    console.log(`  - assets/`);
    console.log(chalk.blue(`\nNext: cd ${skillName} && osm publish`));

  } catch (error) {
    console.log(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
}

function titleCase(name) {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function generateSkillMd(name, { description, license, author, version }) {
  const metaLines = [];
  if (author) metaLines.push(`  author: ${author}`);
  if (version) metaLines.push(`  version: ${version}`);
  const metaBlock = metaLines.length > 0 ? `metadata:\n${metaLines.join('\n')}\n` : '';
  const licenseField = license ? `license: ${license}\n` : '';

  return `---
name: ${name}
description: ${description}
${licenseField}${metaBlock}---

# ${titleCase(name)}

${description}

## Instructions

When the user asks you to use this skill, follow these steps:

1. Greet the user and confirm what they want to accomplish.
2. Gather any required inputs or configuration.
3. Execute the main operation and return a clear result.

## Examples

**User:** "Run ${name}"
**AI:** "I'll use the ${titleCase(name)} skill now..."

## Notes

- See \`references/api-reference.md\` for API details.
- Run \`scripts/setup.sh\` to configure the environment.
`;
}

function generateReadme(name, { description, license, author, version }) {
  return `# ${titleCase(name)}

${description}

## Installation

\`\`\`bash
osm install ${name}
\`\`\`

## Usage

After installing, your AI agent will automatically use this skill when relevant.
You can also invoke it explicitly:

> "Use the ${name} skill to..."

## Structure

\`\`\`
${name}/
├── SKILL.md              # Skill definition and instructions
├── README.md             # This file
├── scripts/
│   └── setup.sh          # Environment setup
├── references/
│   └── api-reference.md  # API documentation
└── assets/               # Static assets
\`\`\`

## Development

1. Edit \`SKILL.md\` to refine instructions for the AI agent.
2. Add API docs or guides to \`references/\`.
3. Add setup scripts to \`scripts/\`.
4. Publish when ready:
   \`\`\`bash
   osm publish
   \`\`\`

## License

${license || 'MIT'}${author ? `\n\n## Author\n\n${author}` : ''}
`;
}

export default {
  createCommand
};
