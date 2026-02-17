---
name: news-digest
description: Aggregate and summarize news from multiple RSS feeds with AI-powered categorization, trending detection, and sentiment analysis.
---

# News Digest Skill Instructions

When the user asks you to fetch or summarize news, follow these steps:

## Setup

1. **Install dependencies:**
   ```bash
   npm install rss-parser@^3.13.0 openai@^4.20.0
   ```

2. **Configure sources:** Add RSS feeds using the helper script
   ```bash
   node scripts/add-source.js --url https://feeds.example.com/rss --category tech
   ```

3. **OpenAI API Key:** Set your OpenAI key for AI summarization
   ```bash
   export OPENAI_API_KEY=sk-...
   ```

4. **Sources:** See `references/sources.yaml` for predefined news sources (100+ feeds)

## Core Operations

### Daily Digest
```javascript
const digest = await execute('digest');
// Returns: Top 10 stories summarized, trending topics, sentiment scores
```

### Category-Specific News
```javascript
const tech = await execute('category', { name: 'tech' });
// Categories: tech, business, science, politics, sports, entertainment
```

### Trending Topics
```javascript
const trending = await execute('trending');
// Detects: Most mentioned topics, viral stories, breaking news
```

### Custom Search
```javascript
const results = await execute('search', { query: 'AI regulation' });
// Searches across all feeds and summarizes relevant articles
```

## Permissions Required

- `read_feeds` - Access to RSS feed parsing
- `internet_access` - Fetch articles from news sources

## Important Notes

- Uses OpenAI GPT-4 for intelligent summarization
- Caches digests for 1 hour to reduce API costs
- Supports 100+ news sources (see `references/sources.yaml`)
- Sentiment analysis: positive, negative, neutral
- All feeds are fetched concurrently for speed
const trends = await newsDigest.execute('trending');

// List all articles
const articles = await newsDigest.execute('list');
```

## 📊 API Reference

### `execute(action, options)`

Esegue un'azione News Digest.

**Actions disponibili:**

- `digest` - Digest giornaliero AI-powered
  - Returns: `{ topStories, keyTopics, sentiment, digest }`
  
- `categories` - Articoli per categoria
  - Returns: `{ technology, science, business, other }`
  
- `trending` - Topic trending
  - Returns: Array `[{ topic, mentions }]`
  
- `list` - Lista tutti gli articoli
  - Options: `{ days: number }` (default: 1)

### Esempi

```javascript
// Get daily digest
const digest = await newsDigest.execute('digest');
console.log(digest.digest); // AI summary
console.log('Top stories:', digest.topStories);
console.log('Sentiment:', digest.sentiment);

// Filter by category
const tech = await newsDigest.execute('categories');
console.log('Tech articles:', tech.technology.length);

// What's trending
const trending = await newsDigest.execute('trending');
trending.forEach(trend => {
  console.log(`${trend.topic}: ${trend.mentions} mentions`);
});
```

## 📈 Output Example

```javascript
{
  topStories: [
    "AI Breakthrough: New Language Model Surpasses GPT-4",
    "Apple Announces Revolutionary AR Glasses",
    "Quantum Computing Reaches New Milestone"
  ],
  keyTopics: [
    "Artificial Intelligence",
    "Space Exploration",
    "Quantum Computing"
  ],
  sentiment: "positive",
  trendingTechnologies: [
    "AI/ML",
    "AR/VR",
    "Quantum Computing",
    "Climate Tech"
  ],
  digest: "Today's tech news highlights significant advancements in AI..."
}
```

## 🔒 Permessi Richiesti

- **read_feeds** - Lettura feed RSS
- **internet_access** - Fetching articoli online

## 📁 Struttura

```
news-digest/
├── SKILL.md          # Questo file
├── digest.js         # Entry point
├── references/       # Feed sources
│   ├── sources.yaml  # Lista fonti RSS
│   └── categories.md # Sistema categorizzazione
├── scripts/          # Utility scripts
│   ├── add-source.js # Aggiungi fonte
│   └── test-feed.js  # Test RSS feed
└── assets/           # Templates
    └── email.html    # Template email digest
```

## 🔧 Dependencies

- `rss-parser ^3.13.0` - RSS feed parser
- `openai ^4.20.0` - AI summarization

## ⚙️ Configurazione

Crea `.env`:

```env
OPENAI_API_KEY=your_openai_key
NEWS_SOURCES=techcrunch,hackernews,theverge
UPDATE_INTERVAL=3600
```

### Custom Feed Sources

Modifica `references/sources.yaml`:

```yaml
sources:
  - name: TechCrunch
    url: https://techcrunch.com/feed/
    category: technology
  
  - name: The Verge
    url: https://www.theverge.com/rss/index.xml
    category: technology
```

## 💡 Advanced Features

### Email Delivery

```javascript
// Schedule daily digest via email
await newsDigest.scheduleEmail({
  time: '09:00',
  recipients: ['you@example.com']
});
```

### Webhook Integration

```javascript
// Push to Slack/Discord
await newsDigest.webhook({
  url: 'https://hooks.slack.com/...',
  frequency: 'hourly'
});
```

### Custom Filters

```javascript
// Filter by keywords
const filtered = await newsDigest.execute('list', {
  keywords: ['AI', 'climate', 'space'],
  exclude: ['politics']
});
```

## 🤝 Contributing

Contributi benvenuti! Vedi [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

MIT
