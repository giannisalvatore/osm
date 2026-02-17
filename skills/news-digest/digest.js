// news-digest v1.2.0
// Riassume automaticamente feed notizie da varie fonti
// Author: NewsAI

/**
 * News Digest Skill
 * Aggregates and summarizes news from multiple sources
 */

class NewsDigest {
  constructor() {
    this.name = 'news-digest';
    this.version = '1.2.0';
    this.feeds = [
      'https://news.ycombinator.com/rss',
      'https://techcrunch.com/feed/',
      'https://www.theverge.com/rss/index.xml'
    ];
    this.articles = [];
  }

  /**
   * Fetch RSS feeds
   */
  async fetchFeeds() {
    console.log('📡 Fetching RSS feeds...');
    
    // Mock data for demo
    this.articles = [
      {
        title: 'AI Breakthrough: New Language Model Surpasses GPT-4',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/ai-breakthrough',
        pubDate: new Date('2026-02-17'),
        summary: 'Researchers announce a new language model that outperforms existing systems...'
      },
      {
        title: 'Apple Announces Revolutionary AR Glasses',
        source: 'The Verge',
        url: 'https://theverge.com/apple-ar',
        pubDate: new Date('2026-02-16'),
        summary: 'Apple unveils its long-awaited augmented reality glasses at a special event...'
      },
      {
        title: 'Quantum Computing Reaches New Milestone',
        source: 'Hacker News',
        url: 'https://news.ycombinator.com/quantum',
        pubDate: new Date('2026-02-15'),
        summary: 'Scientists achieve quantum supremacy with 1000-qubit processor...'
      },
      {
        title: 'Climate Tech Startups Raise Record Funding',
        source: 'TechCrunch',
        url: 'https://techcrunch.com/climate-tech',
        pubDate: new Date('2026-02-14'),
        summary: 'Clean energy and carbon capture companies attract $10B in new investments...'
      },
      {
        title: 'SpaceX Successfully Lands on Mars',
        source: 'The Verge',
        url: 'https://theverge.com/spacex-mars',
        pubDate: new Date('2026-02-13'),
        summary: 'First crewed mission to Mars lands successfully, marking historic achievement...'
      }
    ];

    console.log(`✓ Fetched ${this.articles.length} articles`);
    return this.articles;
  }

  /**
   * Categorize articles by topic
   */
  categorizeArticles() {
    const categories = {
      technology: [],
      science: [],
      business: [],
      other: []
    };

    this.articles.forEach(article => {
      const title = article.title.toLowerCase();
      
      if (title.includes('ai') || title.includes('tech') || title.includes('software')) {
        categories.technology.push(article);
      } else if (title.includes('quantum') || title.includes('science') || title.includes('research')) {
        categories.science.push(article);
      } else if (title.includes('funding') || title.includes('startup') || title.includes('business')) {
        categories.business.push(article);
      } else {
        categories.other.push(article);
      }
    });

    return categories;
  }

  /**
   * Generate AI summary of articles
   */
  async generateAISummary(articles) {
    console.log('🤖 Generating AI summary...');
    
    // Mock AI summary
    const summary = {
      topStories: articles.slice(0, 3).map(a => a.title),
      keyTopics: ['Artificial Intelligence', 'Space Exploration', 'Quantum Computing'],
      sentiment: 'positive',
      trendingTechnologies: ['AI/ML', 'AR/VR', 'Quantum Computing', 'Climate Tech'],
      digest: `Today's tech news highlights significant advancements in AI with a new language model 
surpassing GPT-4, Apple's revolutionary AR glasses announcement, and quantum computing reaching 
new milestones. The climate tech sector is also seeing record funding, while SpaceX achieves 
a historic Mars landing. Overall sentiment in the tech industry remains highly optimistic.`
    };

    return summary;
  }

  /**
   * Filter articles by date range
   */
  filterByDate(articles, daysBack = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    return articles.filter(article => 
      new Date(article.pubDate) >= cutoffDate
    );
  }

  /**
   * Get trending topics
   */
  getTrendingTopics() {
    const topics = new Map();
    
    this.articles.forEach(article => {
      const words = article.title.toLowerCase().split(' ');
      words.forEach(word => {
        if (word.length > 4) { // Filter short words
          topics.set(word, (topics.get(word) || 0) + 1);
        }
      });
    });

    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, mentions: count }));
  }

  /**
   * Execute the skill
   */
  async execute(action = 'digest', options = {}) {
    console.log(`\n📰 News Digest v${this.version}`);
    console.log('─'.repeat(50));

    try {
      await this.fetchFeeds();

      switch (action) {
        case 'digest':
          const summary = await this.generateAISummary(this.articles);
          console.log('\n📊 Daily Tech Digest:');
          console.log(`\n${summary.digest}\n`);
          console.log('🔥 Top Stories:');
          summary.topStories.forEach((story, i) => {
            console.log(`  ${i + 1}. ${story}`);
          });
          console.log('\n🏷️  Key Topics:', summary.keyTopics.join(', '));
          console.log('📈 Trending:', summary.trendingTechnologies.join(', '));
          console.log(`😊 Sentiment: ${summary.sentiment}`);
          return summary;

        case 'categories':
          const categories = this.categorizeArticles();
          console.log('\n📑 Articles by Category:');
          Object.entries(categories).forEach(([category, articles]) => {
            console.log(`\n${category.toUpperCase()} (${articles.length}):`);
            articles.forEach(article => {
              console.log(`  • ${article.title}`);
            });
          });
          return categories;

        case 'trending':
          const trends = this.getTrendingTopics();
          console.log('\n🔥 Trending Topics:');
          trends.forEach((trend, i) => {
            console.log(`  ${i + 1}. ${trend.topic} (${trend.mentions} mentions)`);
          });
          return trends;

        case 'list':
          console.log(`\n📰 Recent Articles (${this.articles.length}):`);
          this.articles.forEach((article, i) => {
            console.log(`\n${i + 1}. ${article.title}`);
            console.log(`   Source: ${article.source} | ${article.pubDate.toLocaleDateString()}`);
            console.log(`   ${article.summary}`);
          });
          return this.articles;

        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    }
  }
}

// Export for use
export default new NewsDigest();

// CLI usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  const skill = new NewsDigest();
  skill.execute('digest').catch(console.error);
}
