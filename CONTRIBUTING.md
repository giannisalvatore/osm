# Contributing to OSMAgent

Thank you for your interest in contributing to OSMAgent!

## Development Setup

1. Clone the repository
```bash
git clone https://github.com/osmteam/osm
cd osm
```

2. Install dependencies
```bash
./quickstart.sh
```

3. Start development servers
```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend

# Terminal 3 - Install CLI
./install.sh
```

## Project Structure

```
osm/
├── packages/
│   ├── backend/      # Koa API + SQLite
│   ├── frontend/     # Astro + Tailwind
│   └── cli/          # CLI tool
└── skills/           # Demo skills
```

## Creating a New Skill

1. Create a new directory in `skills/`
2. Add a `SKILL.json` manifest
3. Implement the skill logic
4. Add a README.md

See existing skills for examples:
- `skills/gmail-reader/`
- `skills/budget-analyzer/`
- `skills/news-digest/`

## Manifest Format (SKILL.json)

```json
{
  "name": "your-skill",
  "version": "1.0.0",
  "description": "Brief description",
  "author": "Your Name",
  "repository": "https://github.com/you/your-skill",
  "ai_verified": false,
  "permissions": ["permission1", "permission2"],
  "entrypoint": "index.js",
  "dependencies": {
    "package": "^1.0.0"
  }
}
```

## Coding Standards

- Use ES modules (`import/export`)
- Follow existing code style
- Add comments for complex logic
- Include error handling
- Write descriptive commit messages

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
