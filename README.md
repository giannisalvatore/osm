<div align="center">

# osm

**Open Skills Manager for AI Agents**

The package manager for AI agent skills. Install, publish and manage skills compatible with Claude, Cursor, Windsurf and any OpenSkills-compatible agent.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)

</div>

---

## Install the CLI

```bash
curl -fsSL https://www.osmagent.com/install.sh | bash
```

Requires Node.js 18 or higher.

---

## Quick start

```bash
# Search for a skill
osm search gmail

# Install a skill
osm install gmail-reader

# Check what's installed
osm list

# Get skill details
osm info gmail-reader
```

After `osm install`, the skill is extracted to `~/.osm/skills/<name>` and ready to be picked up by your AI agent.

---

## All commands

| Command | Description |
|---|---|
| `osm search <query>` | Search the registry by name or description |
| `osm install <skill>` | Download and install a skill locally |
| `osm info <skill>` | Show metadata, version and description |
| `osm list` | List all installed skills |
| `osm update <skill>` | Update a skill to its latest version |
| `osm remove <skill>` | Uninstall a skill |
| `osm signup` | Create an account on the registry |
| `osm login` | Log in and save your auth token |
| `osm whoami` | Show the currently logged-in user |
| `osm publish` | Publish the skill in the current directory |
| `osm create <name>` | Scaffold a new skill directory |

---

## Publishing a skill

A skill is a directory with a `SKILL.md` file as its only requirement.

### 1. Create the skill

```bash
osm create my-skill
cd my-skill
```

This scaffolds:

```
my-skill/
└── SKILL.md
```

### 2. Write the SKILL.md

```markdown
---
name: my-skill
description: What your skill does, in one sentence.
version: 1.0.0
author: your-username
---

# My Skill

Instructions for the AI agent go here.
Write them as you would write a system prompt.
```

**Frontmatter rules:**
- `name` — must match the directory name, lowercase, hyphens only, 1–64 chars
- `description` — required, max 1024 chars
- `version` — optional, defaults to `1.0.0`

### 3. Publish

```bash
osm signup          # first time only
osm login
osm publish
```

The skill is now discoverable at `https://osmagent.com` and installable by anyone via `osm install my-skill`.

---

## How versioning works

- Every `osm publish` creates an **immutable** version. You cannot overwrite a published `name@version`.
- Bump the version in `SKILL.md` frontmatter before each new publish.
- Only the original publisher can publish new versions of a skill.

---

## Local install layout

```
~/.osm/
├── auth.json          # login token (auto-managed by osm login)
├── skills/
│   └── gmail-reader/  # extracted skill files
└── cache/
    └── gmail-reader@1.0.0/
        └── gmail-reader-1.0.0.tgz   # cached tarball for offline fallback
```

Tarballs are integrity-verified before extraction. If the registry is unreachable, OSM falls back to the local cache automatically.

---

## Browse the registry

Visit **[osmagent.com](https://osmagent.com)** to search and browse all published skills.

---

## License

MIT — see [LICENSE](./LICENSE)


---
