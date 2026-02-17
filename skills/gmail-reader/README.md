# Gmail Reader Skill

Legge e analizza le tue email Gmail con funzionalità AI-powered.

**Version:** 1.0.0  
**Author:** OSMTeam  
**Repository:** https://github.com/osmteam/gmail-reader

## Features

- 📧 Legge email recenti
- 🔍 Ricerca email per query
- 📊 Analizza pattern e statistiche
- 🤖 AI-Verified skill

## Permissions

- `read_email` - Accesso in lettura alle email
- `access_gmail` - Accesso all'API Gmail

## Dependencies

```json
{
  "googleapis": "^118.0.0",
  "axios": "^1.5.0"
}
```

## Installation

```bash
osm i gmail-reader
```

## Usage

```javascript
import gmailReader from 'gmail-reader';

// Fetch recent emails
const emails = await gmailReader.execute('fetch', { limit: 10 });

// Search emails
const results = await gmailReader.execute('search', { query: 'meeting' });

// Analyze patterns
const analysis = await gmailReader.execute('analyze');
```

## API

### `execute(action, options)`

Executes the Gmail Reader skill with the specified action.

**Actions:**
- `fetch` - Fetch recent emails (options: `{ limit: number }`)
- `search` - Search emails (options: `{ query: string }`)
- `analyze` - Analyze email patterns

## Configuration

Create a `.env` file:

```
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
```

## License

MIT
