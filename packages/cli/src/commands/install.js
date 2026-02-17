import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { fetchSkill, incrementDownloads } from '../utils/api.js';
import { ensureOSMDir, isSkillInstalled, saveSkillManifest } from '../utils/storage.js';
import { getSkillPath } from '../config.js';

export async function installCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm i <skill-name>'));
    return;
  }

  const spinner = ora(`Installing ${skillName}...`).start();

  try {
    await ensureOSMDir();

    // Check if already installed
    if (await isSkillInstalled(skillName)) {
      spinner.warn(`${skillName} is already installed`);
      console.log(chalk.gray(`Use 'osm u ${skillName}' to update`));
      return;
    }

    // Fetch skill info from registry
    const data = await fetchSkill(skillName);
    const skill = data.skill;

    spinner.text = `Installing ${skillName} v${skill.version}...`;

    // Create skill directory
    const skillPath = getSkillPath(skillName);
    await fs.ensureDir(skillPath);

    // Save manifest as SKILL.json
    const manifest = {
      name: skill.name,
      version: skill.version,
      description: skill.description,
      author: skill.author,
      repository: skill.repository,
      ai_verified: skill.ai_verified,
      permissions: skill.permissions,
      entrypoint: skill.entrypoint,
      dependencies: skill.dependencies
    };

    await saveSkillManifest(skillName, manifest);

    // Create a basic entry point file
    const entrypointPath = `${skillPath}/${skill.entrypoint}`;
    const entrypointContent = `// ${skill.name} v${skill.version}
// ${skill.description}
// Author: ${skill.author}

console.log('${skill.name} skill loaded!');

export default {
  name: '${skill.name}',
  version: '${skill.version}',
  execute: async () => {
    console.log('Executing ${skill.name}...');
    // Add skill logic here
  }
};
`;

    await fs.writeFile(entrypointPath, entrypointContent);

    // Create README
    const readme = `# ${skill.name}

${skill.description}

**Version:** ${skill.version}  
**Author:** ${skill.author}  
**Repository:** ${skill.repository}

## Permissions

${skill.permissions.map(p => `- ${p}`).join('\n')}

## Dependencies

\`\`\`json
${JSON.stringify(skill.dependencies, null, 2)}
\`\`\`

## Installation

This skill was installed via OSM CLI:

\`\`\`bash
osm i ${skill.name}
\`\`\`

## Usage

\`\`\`bash
osm info ${skill.name}
\`\`\`
`;

    await fs.writeFile(`${skillPath}/README.md`, readme);

    // Increment download counter
    await incrementDownloads(skillName);

    spinner.succeed(chalk.green(`Successfully installed ${skillName} v${skill.version}`));
    
    if (skill.ai_verified) {
      console.log(chalk.green('  ✓ AI-Verified'));
    }
    
    console.log(chalk.gray(`  Installed to: ${skillPath}`));
    console.log(chalk.gray(`\n  Run 'osm info ${skillName}' for more details`));

  } catch (error) {
    spinner.fail(`Failed to install ${skillName}`);
    
    if (error.response?.status === 404) {
      console.error(chalk.red(`Skill "${skillName}" not found in registry`));
      console.log(chalk.gray(`Run 'osm search ${skillName}' to find similar skills`));
    } else {
      console.error(chalk.red(error.message));
    }
  }
}
