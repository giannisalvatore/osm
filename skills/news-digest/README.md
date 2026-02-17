# News Digest Skill

Riassume automaticamente feed notizie da varie fonti con AI-powered insights.

**Version:** 1.2.0  
**Author:** NewsAI  
**Repository:** https://github.com/newsai/news-digest

## Features

- 📰 Aggregazione multi-source RSS feeds
- 🤖 AI-powered summarization
- 📊 Categorizzazione automatica
- 🔥 Trending topics detection
- 😊 Sentiment analysis
- 🤖 AI-Verified skill

## Permissions

- `read_feeds` - Accesso ai feed RSS
- `internet_access` - Connessione internet per fetch

## Dependencies

```json
{
  "rss-parser": "^3.13.0",
  "openai": "^4.20.0"
}
```

## Installation

```bash
osm i news-digest
```

## Usage

```javascript
import newsDigest from 'news-digest';

// Daily digest
const summary = await newsDigest.execute('digest');

// View by categories
const categories = await newsDigest.execute('categories');

// Trending topics
const trends = await newsDigest.execute('trending');

// List all articles
const articles = await newsDigest.execute('list');
```

## API

### `execute(action, options)`

Executes the News Digest skill with the specified action.

**Actions:**
- `digest` - Generate AI-powered daily digest
- `categories` - View articles organized by category
- `trending` - Show trending topics
- `list` - List all recent articles

## Output Example

```
Daily Tech Digest:

Today's tech news highlights significant advancements in AI with 
a new language model surpassing GPT-4, Apple's revolutionary AR 
glasses announcement, and quantum computing reaching new milestones.

Top Stories:
  1. AI Breakthrough: New Language Model Surpasses GPT-4
  2. Apple Announces Revolutionary AR Glasses
  3. Quantum Computing Reaches New Milestone

Key Topics: Artificial Intelligence, Space Exploration, Quantum Computing
Trending: AI/ML, AR/VR, Quantum Computing, Climate Tech
Sentiment: positive
```

## Configuration

Add custom RSS feeds in configuration:

```javascript
newsDigest.feeds = [
  'https://news.ycombinator.com/rss',
  'https://techcrunch.com/feed/',
  'https://your-custom-feed.com/rss'
];
```

## Advanced Features

- **Smart Filtering:** Filter by date, source, or topic
- **Email Delivery:** Schedule daily digest via email
- **Webhook Integration:** Push summaries to Slack/Discord
- **Custom Categories:** Define your own categorization rules

## License

MIT
