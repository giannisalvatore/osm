// budget-analyzer v1.0.0
// Analizza le tue spese e abbonamenti automaticamente
// Author: MarioDev

import { format, subMonths, parseISO } from 'date-fns';

/**
 * Budget Analyzer Skill
 * Analyzes expenses and subscriptions automatically
 */

class BudgetAnalyzer {
  constructor() {
    this.name = 'budget-analyzer';
    this.version = '1.0.0';
    this.expenses = [];
    this.subscriptions = [];
  }

  /**
   * Load expenses from data source
   */
  async loadExpenses() {
    console.log('💰 Loading expenses...');
    
    // Mock data for demo
    this.expenses = [
      { date: '2026-02-01', category: 'groceries', amount: 120.50, description: 'Supermarket' },
      { date: '2026-02-03', category: 'transport', amount: 45.00, description: 'Fuel' },
      { date: '2026-02-05', category: 'dining', amount: 65.00, description: 'Restaurant' },
      { date: '2026-02-10', category: 'utilities', amount: 150.00, description: 'Electricity' },
      { date: '2026-02-15', category: 'groceries', amount: 98.75, description: 'Supermarket' },
    ];

    return this.expenses;
  }

  /**
   * Detect recurring subscriptions
   */
  async detectSubscriptions() {
    console.log('📅 Detecting subscriptions...');
    
    // Mock subscription data
    this.subscriptions = [
      { name: 'Netflix', amount: 15.99, frequency: 'monthly', nextBilling: '2026-03-01' },
      { name: 'Spotify', amount: 9.99, frequency: 'monthly', nextBilling: '2026-03-05' },
      { name: 'Amazon Prime', amount: 99.00, frequency: 'yearly', nextBilling: '2027-02-01' },
      { name: 'Gym Membership', amount: 45.00, frequency: 'monthly', nextBilling: '2026-03-01' }
    ];

    return this.subscriptions;
  }

  /**
   * Calculate category totals
   */
  calculateCategoryTotals() {
    const totals = {};
    
    this.expenses.forEach(expense => {
      if (!totals[expense.category]) {
        totals[expense.category] = 0;
      }
      totals[expense.category] += expense.amount;
    });

    return totals;
  }

  /**
   * Calculate monthly subscription cost
   */
  calculateMonthlySubscriptionCost() {
    let monthlyTotal = 0;

    this.subscriptions.forEach(sub => {
      if (sub.frequency === 'monthly') {
        monthlyTotal += sub.amount;
      } else if (sub.frequency === 'yearly') {
        monthlyTotal += sub.amount / 12;
      }
    });

    return monthlyTotal;
  }

  /**
   * Generate spending insights
   */
  generateInsights() {
    const categoryTotals = this.calculateCategoryTotals();
    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const subscriptionCost = this.calculateMonthlySubscriptionCost();

    const insights = {
      totalSpent: totalSpent.toFixed(2),
      categoryBreakdown: categoryTotals,
      topCategory: Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0],
      subscriptions: {
        count: this.subscriptions.length,
        monthlyTotal: subscriptionCost.toFixed(2),
        yearlyProjection: (subscriptionCost * 12).toFixed(2)
      },
      recommendations: this.generateRecommendations(categoryTotals, subscriptionCost)
    };

    return insights;
  }

  /**
   * Generate budget recommendations
   */
  generateRecommendations(categoryTotals, subscriptionCost) {
    const recommendations = [];

    // Check for high subscription costs
    if (subscriptionCost > 100) {
      recommendations.push({
        type: 'subscription',
        message: `You're spending $${subscriptionCost.toFixed(2)}/month on subscriptions. Consider reviewing unused services.`,
        priority: 'medium'
      });
    }

    // Check for high dining expenses
    if (categoryTotals.dining > 200) {
      recommendations.push({
        type: 'dining',
        message: 'Dining expenses are high. Cooking at home could save money.',
        priority: 'low'
      });
    }

    // General savings tip
    recommendations.push({
      type: 'savings',
      message: 'Aim to save at least 20% of your monthly income.',
      priority: 'high'
    });

    return recommendations;
  }

  /**
   * Execute the skill
   */
  async execute(action = 'analyze', options = {}) {
    console.log(`\n💰 Budget Analyzer v${this.version}`);
    console.log('─'.repeat(50));

    try {
      await this.loadExpenses();
      await this.detectSubscriptions();

      switch (action) {
        case 'analyze':
          const insights = this.generateInsights();
          console.log('\n📊 Financial Analysis:');
          console.log(`\nTotal Spent: $${insights.totalSpent}`);
          console.log(`\nCategory Breakdown:`);
          Object.entries(insights.categoryBreakdown).forEach(([cat, amount]) => {
            console.log(`  ${cat}: $${amount.toFixed(2)}`);
          });
          console.log(`\nSubscriptions: ${insights.subscriptions.count} active`);
          console.log(`Monthly Cost: $${insights.subscriptions.monthlyTotal}`);
          console.log(`\n💡 Recommendations:`);
          insights.recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. [${rec.priority}] ${rec.message}`);
          });
          return insights;

        case 'subscriptions':
          console.log('\n📅 Active Subscriptions:');
          this.subscriptions.forEach(sub => {
            console.log(`  • ${sub.name}: $${sub.amount} (${sub.frequency})`);
          });
          return this.subscriptions;

        case 'expenses':
          console.log(`\n💳 Recent Expenses (${this.expenses.length}):`);
          this.expenses.forEach(exp => {
            console.log(`  • ${exp.date} - ${exp.description}: $${exp.amount}`);
          });
          return this.expenses;

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
export default new BudgetAnalyzer();

// CLI usage example
if (import.meta.url === `file://${process.argv[1]}`) {
  const skill = new BudgetAnalyzer();
  skill.execute('analyze').catch(console.error);
}
