<div align="center">

# osm

**Open Skills Manager for AI Agents**

The npm-style package manager for AI agent capabilities. Install, share, and manage skills across Claude, GPT, and any AI agent platform.

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![OpenSkills Compatible](https://img.shields.io/badge/OpenSkills-Compatible-purple.svg)](https://github.com/numman-ali/openskills)

[Quick Start](#-quick-start) • [Documentation](./SETUP_GUIDE.md) • [Examples](#-usage) • [Contributing](./CONTRIBUTING.md)

</div>

---

## 🎯 What is OSM?

OSM is the **first universal package manager for AI agent skills**. Think npm, but for AI capabilities.

```bash
# Install any skill in seconds
osm install gmail-reader

# Your AI agent can now read and analyze Gmail
# Skills work across Claude, GPT, Cursor, Windsurf, and any OpenSkills-compatible agent
```

**Why OSM?**
- 📦 **Universal Format**: Compatible with OpenSkills standard (Claude, Cursor, Windsurf)
- ⚡ **Instant Installation**: npm-style CLI for frictionless skill management
- 🔍 **Discoverable**: Browse and search 100+ community skills
- 🤖 **AI-Verified**: Trust badges for security-reviewed skills
- 🔒 **Permission System**: Granular control over what skills can access
- 🌐 **Self-Hosted**: Own your data with SQLite backend

---

## ✨ Features

<table>
<tr>
<td width="50%">

### For Users
- 🎯 **One-Command Install** - `osm i <skill>` and you're done
- 🔐 **Transparent Permissions** - See exactly what each skill accesses
- 📊 **Marketplace UI** - Beautiful web interface to browse skills
- 🔄 **Version Management** - Update, rollback, remove skills easily
- 🌍 **Works Everywhere** - Compatible with all OpenSkills agents

</td>
<td width="50%">

### For Developers
- 📝 **Simple Format** - SKILL.md with YAML frontmatter
- 🚀 **Auto-Discovery** - Drop in `skills/` folder, done
- 🎨 **Full Stack** - Backend API + Frontend UI + CLI
- 💾 **SQLite Storage** - No external dependencies
- 🔧 **Developer Friendly** - Hot reload, TypeScript-ready

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Installation

```bash
# Clone and setup
git clone https://github.com/yourusername/osm.git
cd osm
./quickstart.sh
```

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
osm list

# Install a skill
osm install gmail-reader

# Your AI agent now has new capabilities! 🎉
```

---

## 💡 Usage

### Command Line Interface

```bash
osm list                      # List all available skills
osm search <query>            # Search for skills
osm install <skill>           # Install a skill
osm update <skill>            # Update to latest version
osm remove <skill>            # Uninstall a skill
osm info <skill>              # Show detailed information
```

### Web Interface

Visit **http://localhost:4321** to browse the marketplace:

- 🏪 **Marketplace** - Browse all available skills
- 🔍 **Search** - Find skills by name, category, or description
- 📋 **Skill Details** - View permissions, dependencies, installation commands
- 📖 **Documentation** - Complete API reference

### REST API

```bash
# List all skills
curl http://localhost:3000/skills

# Get skill details
curl http://localhost:3000/skills/gmail-reader

# Search skills
curl http://localhost:3000/skills/search/email
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
│                    │  Skills Store  │                      │
│                    │  (~/.osm/)     │                      │
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

## 📦 Skill Format

OSM uses the **OpenSkills** format - the same standard powering Claude, Cursor, and Windsurf.

### Basic Structure

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
osm list
osm search email
osm install gmail-reader

# Test API
curl http://localhost:3000/health
curl http://localhost:3000/skills

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
