import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import { createSkill } from '../utils/api.js';
import { CONFIG } from '../config.js';

export async function publishCommand(skillPath = '.') {
  const spinner = ora('Publishing skill to registry...').start();

  try {
    // Resolve skill directory
    const skillDir = path.resolve(process.cwd(), skillPath);
    const skillMdPath = path.join(skillDir, 'SKILL.md');
    const indexJsPath = path.join(skillDir, 'index.js');

    // Validate skill structure
    if (!fs.existsSync(skillMdPath)) {
      throw new Error('SKILL.md not found. Are you in a skill directory?');
    }

    if (!fs.existsSync(indexJsPath)) {
      throw new Error('index.js not found. Invalid skill structure.');
    }

    // Read SKILL.md
    const skillMdContent = fs.readFileSync(skillMdPath, 'utf-8');

    // Parse YAML frontmatter
    const frontmatterMatch = skillMdContent.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      throw new Error('Invalid SKILL.md format: missing YAML frontmatter');
    }

    const frontmatter = frontmatterMatch[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
    const authorMatch = frontmatter.match(/^author:\s*(.+)$/m);
    const repoMatch = frontmatter.match(/^repository:\s*(.+)$/m);

    if (!nameMatch || !descMatch) {
      throw new Error('SKILL.md must contain name and description in frontmatter');
    }

    const skillName = nameMatch[1].trim();
    const description = descMatch[1].trim();
    const author = authorMatch ? authorMatch[1].trim() : 'unknown';
    const repository = repoMatch ? repoMatch[1].trim() : '';

    // Extract permissions from markdown
    const permissions = [];
    const permSection = skillMdContent.match(/## Permissions Required\n\n([\s\S]*?)(?=\n##|\n---|\n```|$)/);
    if (permSection) {
      const permMatches = permSection[1].matchAll(/`([^`]+)`/g);
      for (const match of permMatches) {
        permissions.push(match[1]);
      }
    }

    spinner.text = `Publishing ${skillName}...`;

    // Prepare payload
    const payload = {
      name: skillName,
      version: '1.0.0',
      description: description,
      author: author,
      repository: repository,
      ai_verified: false,
      permissions: permissions,
      entrypoint: 'index.js',
      dependencies: {},
      category: 'custom'
    };

    // POST to backend
    await createSkill(payload);

    spinner.succeed('Published to online registry!');
    console.log(chalk.green(`\n✓ Skill published: ${skillName}`));
    console.log(chalk.gray(`  View: ${CONFIG.API_URL}/skills/${skillName}`));
    console.log(chalk.gray(`  Install: osm install ${skillName}`));

  } catch (error) {
    spinner.fail('Failed to publish');
    
    if (error.response) {
      // API error
      const status = error.response.status;
      const message = error.response.data?.error || error.message;
      
      if (status === 409) {
        console.log(chalk.red(`\n❌ Skill already exists in registry`));
        console.log(chalk.yellow(`\n💡 To update, increment version in SKILL.md or use: osm unpublish <skill>`));
      } else {
        console.log(chalk.red(`\n❌ ${message}`));
      }
    } else {
      console.log(chalk.red(`\n❌ ${error.message}`));
    }
    
    process.exit(1);
  }
}
