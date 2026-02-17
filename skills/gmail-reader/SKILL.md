---
name: gmail-reader
description: Read and analyze Gmail emails with AI-powered filtering, search, and pattern detection.
---

# Gmail Reader Skill Instructions

When the user asks you to work with their Gmail, follow these steps:

## Setup

1. **Install dependencies:**
   ```bash
   npm install googleapis@^118.0.0 axios@^1.5.0
   ```

2. **OAuth Setup:** Run the OAuth configuration script
   ```bash
   node scripts/setup-oauth.js
   ```
   This will guide you through Google OAuth consent flow.

3. **API Credentials:** See `references/api-reference.md` for detailed Gmail API documentation.

## Core Operations

### Reading Recent Emails
```javascript
// Fetch last 10 emails
const emails = await execute('fetch', { limit: 10 });
```

### Searching Emails
```javascript
// Search by query
const results = await execute('search', { 
  query: 'meeting',
  from: 'boss@company.com'
});
```

### Analyzing Patterns
```javascript
// Get email statistics and trends
const analysis = await execute('analyze');
// Returns: categorization, sender frequency, response time patterns
```

## Permissions Required

- `read_email` - Read access to Gmail messages
- `access_gmail` - OAuth scope for Gmail API

## Important Notes

- This skill is **read-only** and cannot send, delete, or modify emails
- OAuth tokens are stored locally in `~/.osm/credentials/gmail.json`
- Rate limits: 250 quota units per user per second (Gmail API)
- See `references/api-reference.md` for complete API documentation

## 📊 API Reference

### `execute(action, options)`

Esegue un'azione Gmail Reader.

**Actions disponibili:**

- `fetch` - Recupera email recenti
  - Options: `{ limit: number }` (default: 10)
  
- `search` - Cerca email
  - Options: `{ query: string }`
  
- `analyze` - Analizza pattern email
  - Options: nessuno

**Returns:** Promise con i risultati dell'azione

### Esempi

```javascript
// Fetch 20 recent emails
const emails = await gmailReader.execute('fetch', { limit: 20 });
console.log(`Found ${emails.length} emails`);

// Search for specific sender
const fromJohn = await gmailReader.execute('search', { 
  query: 'from:john@example.com' 
});

// Get analytics
const stats = await gmailReader.execute('analyze');
console.log('Unread:', stats.unread);
console.log('Top senders:', stats.topSenders);
```

## 🔒 Permessi Richiesti

- **read_email** - Lettura contenuto email
- **access_gmail** - Accesso API Gmail

## ⚙️ Configurazione

Crea un file `.env` nella root della skill:

```env
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
```

## 📁 Struttura

```
gmail-reader/
├── SKILL.md          # Questo file
├── index.js          # Entry point
├── references/       # Documentazione API
├── scripts/          # Helper scripts
└── assets/           # Risorse
```

## 🔧 Dependencies

- `googleapis ^118.0.0` - Google APIs client
- `axios ^1.5.0` - HTTP client

## 📝 Note

Questa skill richiede autenticazione OAuth2 con Gmail. Segui la documentazione ufficiale Google per ottenere le credenziali.

## 🤝 Contributing

Contributi benvenuti! Vedi [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

MIT
