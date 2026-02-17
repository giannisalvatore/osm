<div align="center">

# osm

**Open Skills Manager for AI Agents**

The npm-style package manager for AI agent capabilities. Discover, publish, download, and manage GitHub-hosted skills across Claude, GPT, and any AI agent platform.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![OpenSkills Compatible](https://img.shields.io/badge/OpenSkills-Compatible-purple.svg)](https://github.com/numman-ali/openskills)

[Quick Start](#-quick-start) • [Documentation](./SETUP_GUIDE.md) • [Examples](#-usage) • [Contributing](./CONTRIBUTING.md)

</div>

---

## 🎯 What is OSM?

OSM is the **first universal package manager for AI agent skills**. Think npm, but for AI capabilities.

```bash
# Install any skill from the registry in seconds
osm install gmail-reader

# OSM downloads the skill source locally from GitHub for runtime use
# Skills work across Claude, GPT, Cursor, Windsurf, and any OpenSkills-compatible agent
```

**Why OSM?**
- 📦 **Universal Format**: Compatible with OpenSkills standard (Claude, Cursor, Windsurf)
- ⚡ **Instant Install**: npm-style CLI for frictionless skill activation
- 🔍 **Discoverable**: Browse and search 100+ community skills
- 🤖 **AI-Verified**: Trust badges for security-reviewed skills
- 🔒 **Permission System**: Granular control over what skills can access
- 🌐 **Self-Hosted**: Own your data with SQLite backend

---

## ✨ Features

<table>
<tr>
<td width="50%">

### For Users & Agents
- 🎯 **One-Command Install** - `osm i <skill>` downloads the skill locally and registers metadata
- 🔐 **Transparent Permissions** - See exactly what each skill accesses
- 📊 **Marketplace UI** - Beautiful web interface to browse skills
- 🔄 **Version Management** - Update/remove installed skills easily
- 🌍 **Works Everywhere** - Compatible with all OpenSkills agents

</td>
<td width="50%">

### For Skill Creators (Users & Agents)
- 📝 **Simple Authoring** - Build skills in a GitHub repo with SKILL.md + code
- 🚀 **Registry-First Publishing** - Publish metadata pointing to your GitHub repository
- 🎨 **Full Stack** - Backend API + Frontend UI + CLI
- 💾 **SQLite Storage** - Skill metadata and registry links
- 🔧 **Developer Friendly** - Hot reload, TypeScript-ready

</td>
</tr>
</table>

---


## 👥 Scope: who uses OSM vs who develops OSM

### 1) Skill users (agents + skill developers)
- Use the **CLI only** to discover and install skills: `osm search`, `osm install`, `osm update`, `osm uninstall`.
- This is the right scope for:
  - agents that need to run skills;
  - developers that build skills and want to test them locally through OSM.

### 2) OSM developers (CLI/backend/frontend maintainers)
- Work on the OSM codebase itself (`packages/cli`, `packages/backend`, `packages/frontend`).
- Run local services, contribute code, and maintain the platform.

**Local machine responsibility**: OSM stores skill source files + install metadata locally, so agents can execute skills directly after install.

---
## 🚀 Quick Start

### Installation

#### Option A — clone and install (recommended for OSM developers)

```bash
# Clone and setup
git clone https://github.com/giannisalvatore/osm.git
cd osm
./install.sh
```

#### Option B — one-line install (recommended for skill users)

```bash
curl -fsSL https://www.osmagent.com/install.sh | bash
```

> Note: use `bash` (not `sh`) so the installer runs with the expected shell features.

### Start Services

```bash
# Terminal 1: Backend API
npm run dev:backend

# Terminal 2: Frontend UI  
npm run dev:frontend

# Terminal 3: Install CLI
./install.sh
```

### Use the CLI

```bash
# List available skills
osm search gmail-reader

# Install a skill from registry metadata + GitHub source
osm install gmail-reader

# Your AI agent now has new local capabilities, synced from GitHub! 🎉
```

---

## 💡 Usage

### Command Line Interface

```bash
osm search <query>            # Search packages in registry
osm install <package>         # Install package (or all deps if omitted)
osm update <package>          # Update package/dependencies
osm uninstall <package>       # Uninstall package
osm publish                   # Publish current package
osm login <username> <password>
osm whoami
```

### Web Interface

Visit **http://localhost:4321** to browse the marketplace:

- 🏪 **Marketplace** - Browse all available skills
- 🔍 **Search** - Find skills by name, category, or description
- 📋 **Skill Details** - View permissions, dependencies, installation commands
- 📖 **Documentation** - Complete API reference

### REST API

```bash
# Search packages
curl "http://localhost:3000/registry/search?q=gmail"

# Get package metadata
curl http://localhost:3000/registry/gmail-reader

# Download tarball
curl -L http://localhost:3000/registry/gmail-reader/-/gmail-reader-1.0.0.tgz -o gmail-reader.tgz
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         OSM Ecosystem                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │              │   │              │   │              │   │
│  │  CLI (osm)   │   │   Web UI     │   │   REST API   │   │
│  │  Commander   │   │   Astro +    │   │   Koa +      │   │
│  │  + Chalk     │   │   Tailwind   │   │   SQLite     │   │
│  │              │   │              │   │              │   │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                               │
│                    ┌───────▼────────┐                      │
│                    │                │                      │
│                    │ Local Packages │                      │
│                    │ (./.osm/packages)│                      │
│                    │                │                      │
│                    └────────────────┘                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Stack:**
- **Backend**: Node.js, Koa, SQLite, better-sqlite3
- **Frontend**: Astro, Tailwind CSS, Server-Side Rendering
- **CLI**: Commander.js, Chalk, Ora, Axios
- **Format**: OpenSkills (YAML frontmatter + Markdown)

---

## 📦 Skill Authoring Format

OSM uses the **OpenSkills** format for authoring. Runtime distribution pulls source from linked GitHub repositories into local skill folders.

### GitHub Repository Structure

```
my-skill/
├── SKILL.md           # Skill definition (required)
├── index.js           # Implementation
├── references/        # Documentation
│   └── api-docs.md
├── scripts/           # Setup scripts
│   └── install.sh
└── assets/            # Resources
```

### SKILL.md Example

```markdown
---
name: gmail-reader
description: Read and analyze Gmail emails with AI-powered filtering and search.
---

# Gmail Reader Skill Instructions

When the user asks you to work with Gmail, follow these steps:

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install googleapis@^118.0.0
   \`\`\`

2. Configure OAuth (see references/api-docs.md)

## Operations

### Read emails
\`\`\`javascript
const emails = await execute('fetch', { limit: 10 });
\`\`\`

## Permissions Required

- `read_email` - Access to read Gmail messages
- `access_gmail` - OAuth scope for Gmail API
```

**Why this format?**
- ✅ **AI-Native**: Instructions written for agents, not humans
- ✅ **Portable**: Works across all OpenSkills-compatible platforms
- ✅ **Simple**: Just YAML + Markdown, no complex schemas
- ✅ **Extensible**: Add references, scripts, assets as needed

---

## 🎨 Built-in Skills

OSM ships with 3 production-ready skills:

### 📧 gmail-reader
Read and analyze Gmail emails with AI-powered search and categorization.
```bash
osm install gmail-reader
```

### 💰 budget-analyzer  
Track expenses, detect subscriptions, get AI financial insights.
```bash
osm install budget-analyzer
```

### 📰 news-digest
Aggregate and summarize news from 100+ RSS feeds with sentiment analysis.
```bash
osm install news-digest
```

---

## 🛠️ Development

### Project Structure

```
osm/
├── packages/
│   ├── backend/          # Koa REST API
│   ├── frontend/         # Astro web UI
│   └── cli/              # Command-line tool
├── skills/               # Skill repository
│   ├── gmail-reader/
│   ├── budget-analyzer/
│   └── news-digest/
└── scripts/
    ├── install.sh
    ├── uninstall.sh
    └── quickstart.sh
```

### Adding a New Skill

1. **Create skill directory**
   ```bash
   mkdir skills/my-skill
   cd skills/my-skill
   ```

2. **Create SKILL.md**
   ```markdown
   ---
   name: my-skill
   description: What your skill does
   ---
   
   # My Skill Instructions
   
   When the user asks to..., follow these steps:
   ...
   ```

3. **Implement logic** in `index.js`

4. **Restart backend** - Auto-discovery will pick it up
   ```bash
   npm run dev:backend
   ```

### Running Tests

```bash
# Test CLI commands
osm search gmail
osm install gmail-reader
osm whoami

# Test API
curl http://localhost:3000/health
curl "http://localhost:3000/registry/search?q=gmail"

# Test Frontend
open http://localhost:4321
```

---

## 🔐 Security & Permissions

### Permission System

Skills declare required permissions in their SKILL.md:

```markdown
## Permissions Required

- `read_email` - Access to email data
- `internet_access` - Network requests
```

**Available Permissions:**
- `read_email` - Email access
- `read_finance` - Financial data
- `read_calendar` - Calendar access  
- `internet_access` - Network access
- `read_feeds` - RSS feeds

**Note:** Permissions are currently declarative. For production use, implement runtime sandboxing with:
- Deno-style permission prompts
- Capability-based security
- Process isolation (Firecracker, gVisor)

### AI Verification

Skills with the `ai_verified` badge have been:
- ✅ Code-reviewed by AI
- ✅ Scanned for malicious patterns
- ✅ Tested for permission compliance
- ✅ Audited for dependencies

---

## 📚 Documentation

- **[Setup Guide](./SETUP_GUIDE.md)** - Detailed installation and configuration
- **[Quick Reference](./QUICK_REFERENCE.md)** - Command cheat sheet
- **[Contributing](./CONTRIBUTING.md)** - How to contribute
- **[API Reference](./packages/backend/README.md)** - REST API endpoints

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-skill`)
3. **Commit** your changes (`git commit -m 'Add amazing skill'`)
4. **Push** to the branch (`git push origin feature/amazing-skill`)
5. **Open** a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 🗺️ Roadmap

- [ ] **User Authentication** - Secure API with JWT
- [ ] **GitHub Integration** - Auto-publish from repos
- [ ] **Skill Ratings** - Community reviews and stars
- [ ] **Docker Support** - One-command deployment
- [ ] **CI/CD Pipeline** - Automated testing and releases
- [ ] **Webhook System** - Real-time skill updates
- [ ] **Multi-Language** - i18n support
- [ ] **Skill Analytics** - Usage tracking and insights

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

---

## 💬 Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Share skills and get help
- **Twitter**: [@osmagent](https://twitter.com/osmagent) (coming soon)

---

## 🙏 Acknowledgments

Built with inspiration from:
- **npm** - Package management UX
- **OpenSkills** - Skill format standard
- **Anthropic Claude** - AI agent capabilities

---

<div align="center">

**[⬆ Back to Top](#osm)**

Made with ❤️ for the AI agent community

</div>

---

## 📦 npm-Style Package Registry (New)

OSM now includes a **centralized registry API** with npm-like metadata and tarball distribution.

| Endpoint | Method | Purpose |
|---|---|---|
| `/registry/:name` | `GET` | Package metadata (`dist-tags`, all versions, dependency map) |
| `/registry/:name/-/:name-:version.tgz` | `GET` | Download a published tarball |
| `/registry/publish` | `POST` | Publish a new immutable version |
| `/registry/search?q=<query>` | `GET` | Search package names/descriptions |
| `/auth/login` | `POST` | Exchange username/password for auth token |
| `/auth/whoami` | `GET` | Validate current token and return user |

### Version immutability rules

- A published `name@version` can **never be overwritten**.
- Publishing an existing version returns a conflict error.
- You must bump the version in `osm.json` for every new release.

### Ownership & token authentication

- First publisher of a package becomes its owner.
- Only owners can publish new versions of that package.
- `osm login <username> <password>` stores a local token under `~/.osm/auth.json`.

---

## 🧩 Package Format

### `osm.json` (manifest)

```json
{
  "name": "hello-osm",
  "version": "1.0.0",
  "description": "Example package",
  "main": "index.js",
  "dependencies": {
    "gmail-reader": "^1.0.0"
  }
}
```

### `osm-lock.json` (lockfile)

Generated during install/update. Pins exact versions + integrity hashes for reproducible installs.

```json
{
  "lockfileVersion": 1,
  "packages": {
    "gmail-reader": {
      "version": "1.0.1",
      "resolved": "http://localhost:3000/registry/gmail-reader/-/gmail-reader-1.0.1.tgz",
      "integrity": "<sha1>",
      "dependencies": {}
    }
  }
}
```

---

## 🗂️ Local install structure and cache

```text
project/
├── osm.json
├── osm-lock.json
└── .osm/
    └── packages/
        └── <package>/

~/.osm/
├── auth.json
└── cache/
    └── <package>@<version>/
        └── <package>-<version>.tgz
```

- `./.osm/packages` stores extracted tarballs locally per-project.
- `~/.osm/cache` stores verified tarballs for faster reinstall + offline fallback.
- OSM verifies tarball checksum before install.

---

## 🔁 Dependency resolution + lockfile behavior

1. OSM reads `osm.json` dependencies.
2. Resolves semver ranges against the registry.
3. Downloads tarballs and verifies checksums.
4. Installs into `./.osm/packages/<package>`.
5. Writes pinned versions to `osm-lock.json`.

If registry fetch fails, OSM attempts install from valid local cache.

---

## 🧪 CLI commands (npm-style)

```bash
osm publish                 # Publish current package from osm.json
osm install <package>       # Install one package (or run without arg for all deps)
osm update <package>        # Re-resolve and update package/deps
osm uninstall <package>     # Remove package from ./.osm/packages
osm login <username> <password>
osm whoami
osm search <query>
```

### Step-by-step examples

#### Publish
```bash
# 1) Authenticate
osm login admin admin

# 2) Ensure osm.json has name/version/description
cat osm.json

# 3) Publish immutable version
osm publish
```

#### Install + lockfile
```bash
# Install one package
osm install gmail-reader

# Or install all dependencies in osm.json
osm install

# Verify lockfile generated
cat osm-lock.json
```

#### Update
```bash
osm update gmail-reader
```

#### Uninstall
```bash
osm uninstall gmail-reader
```

#### Search and identity
```bash
osm search gmail
osm whoami
```

---

## 🔐 Security & publishing rules (registry)

- Tarballs are checksum-verified before extraction.
- Authentication is required for publish.
- Ownership is enforced server-side.
- Immutable versions prevent supply-chain overwrite of existing releases.
- Cached tarballs are re-validated before offline usage.

---

## 🆚 OSM vs npm (quick comparison)

| Capability | npm | OSM |
|---|---|---|
| Registry metadata + tarballs | ✅ | ✅ |
| Lockfile support | ✅ (`package-lock.json`) | ✅ (`osm-lock.json`) |
| Local cache | ✅ | ✅ (`~/.osm/cache`) |
| Ownership-protected publish | ✅ | ✅ |
| AI skill format support | ❌ | ✅ OpenSkills + `SKILL.md` |

---

## 🔮 Extended roadmap (optional)

- Scoped packages (`@scope/name`)
- Token revocation + expiration
- Provenance signatures (Sigstore/SLSA)
- Delta updates for large tarballs
- Private registries + mirrors
