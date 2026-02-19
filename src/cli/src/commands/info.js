import chalk from 'chalk';
import { fetchMetadata } from '../utils/registry.js';
import { isSkillInstalled, loadSkillManifest } from '../utils/storage.js';

export async function infoCommand(skillName) {
  if (!skillName) {
    console.log(chalk.red('Please provide a skill name'));
    console.log(chalk.gray('Usage: osm info <skill-name>'));
    return;
  }

  try {
    const data = await fetchMetadata(skillName);
    const latest = data['dist-tags']?.latest;
    const versionData = latest ? data.versions?.[latest] : null;
    const installed = await isSkillInstalled(skillName);

    let localVersion = null;
    if (installed) {
      try {
        const manifest = await loadSkillManifest(skillName);
        localVersion = manifest.version;
      } catch {}
    }

    console.log('');
    console.log(chalk.bold.cyan(data.name));
    console.log(chalk.gray('─'.repeat(50)));
    console.log('');
    console.log(`${chalk.bold('Description:')} ${data.description || 'n/a'}`);
    console.log(`${chalk.bold('Latest:')}      ${latest || 'n/a'} ${installed ? chalk.blue(`(installed: v${localVersion})`) : ''}`);
    console.log(`${chalk.bold('Downloads:')}   ${data.downloads || 0}`);

    if (versionData?.compatibility) {
      console.log(`${chalk.bold('Compatibility:')} ${versionData.compatibility}`);
    }

    const versions = Object.keys(data.versions || {});
    if (versions.length > 1) {
      console.log(`${chalk.bold('All versions:')} ${versions.join(', ')}`);
    }
    console.log('');

    if (installed) {
      console.log(chalk.blue('✓ This skill is installed'));
      console.log(chalk.gray(`  Run 'osm update ${skillName}' to update`));
      console.log(chalk.gray(`  Run 'osm rm ${skillName}' to remove`));
    } else {
      console.log(chalk.gray('This skill is not installed'));
      console.log(chalk.gray(`  Run 'osm install ${skillName}' to install`));
    }
    console.log('');

  } catch (error) {
    if (error.response?.status === 404) {
      console.error(chalk.red(`Skill "${skillName}" not found in registry`));

      if (await isSkillInstalled(skillName)) {
        console.log(chalk.yellow('\nShowing local information:\n'));
        try {
          const manifest = await loadSkillManifest(skillName);
          console.log(`${chalk.bold('Name:')}        ${manifest.name}`);
          console.log(`${chalk.bold('Version:')}     ${manifest.version} ${chalk.blue('(installed)')}`);
          console.log(`${chalk.bold('Description:')} ${manifest.description || 'n/a'}`);
        } catch {}
      }
    } else {
      console.error(chalk.red(error.response?.data?.error || error.message));
    }
  }
}
