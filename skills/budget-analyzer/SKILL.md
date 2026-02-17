---
name: budget-analyzer
description: Analyze expenses, detect subscriptions, and provide AI-powered financial insights with spending predictions.
---

# Budget Analyzer Skill Instructions

When the user asks you to analyze their budget or expenses, follow these steps:

## Setup

1. **Install dependencies:**
   ```bash
   npm install axios@^1.5.0 date-fns@^2.30.0
   ```

2. **Import data:** Use the CSV import script
   ```bash
   node scripts/import-csv.js /path/to/transactions.csv
   ```
   Supported formats: Bank statements, credit card exports, Mint CSV

3. **Categories:** See `references/categories.md` for expense category definitions

## Core Operations

### Full Financial Analysis
```javascript
const insights = await execute('analyze');
// Returns: total spending, category breakdown, savings rate, trends
```

### Subscription Detection
```javascript
const subscriptions = await execute('subscriptions');
// Detects: Netflix, Spotify, gym memberships, recurring charges
// Shows: monthly cost, cancellation difficulty, alternatives
```

### Expense Tracking
```javascript
const expenses = await execute('expenses', {
  startDate: '2026-01-01',
  endDate: '2026-01-31',
  category: 'dining'
});
```

### Budget Recommendations
```javascript
const recommendations = await execute('recommend');
// AI-powered suggestions to reduce spending
```

## Permissions Required

- `read_finance` - Access to financial transaction data
- `read_calendar` - Check subscription renewal dates

## Important Notes

- All data is stored locally in `~/.osm/data/budget-analyzer/`
- Supports CSV import from major banks and financial apps
- Uses `date-fns` for date calculations and trend analysis
- See `references/categories.md` for complete expense categorization
```

## 📊 API Reference

### `execute(action, options)`

Esegue un'azione Budget Analyzer.

**Actions disponibili:**

- `analyze` - Analisi completa finanziaria
  - Returns: `{ totalSpent, categoryBreakdown, subscriptions, recommendations }`
  
- `subscriptions` - Lista abbonamenti attivi
  - Returns: Array di abbonamenti con costi mensili/annuali
  
- `expenses` - Lista spese recenti
  - Options: `{ days: number }` (default: 30)

### Esempi

```javascript
// Complete financial analysis
const analysis = await budgetAnalyzer.execute('analyze');
console.log('Total spent:', analysis.totalSpent);
console.log('Top category:', analysis.topCategory);

// Check subscriptions
const subscriptions = await budgetAnalyzer.execute('subscriptions');
subscriptions.forEach(sub => {
  console.log(`${sub.name}: $${sub.amount}/${sub.frequency}`);
});

// Last 7 days expenses
const recentExpenses = await budgetAnalyzer.execute('expenses', { days: 7 });
```

## 📈 Output Example

```javascript
{
  totalSpent: "479.25",
  categoryBreakdown: {
    groceries: 219.25,
    utilities: 150.00,
    dining: 65.00,
    transport: 45.00
  },
  topCategory: ["groceries", 219.25],
  subscriptions: {
    count: 4,
    monthlyTotal: "79.23",
    yearlyProjection: "950.76"
  },
  recommendations: [
    {
      type: "subscription",
      message: "You're spending $79.23/month on subscriptions. Consider reviewing unused services.",
      priority: "medium"
    },
    {
      type: "savings",
      message: "Aim to save at least 20% of your monthly income.",
      priority: "high"
    }
  ]
}
```

## 🔒 Permessi Richiesti

- **read_finance** - Accesso dati finanziari
- **read_calendar** - Lettura date rinnovo abbonamenti

## 📁 Struttura

```
budget-analyzer/
├── SKILL.md          # Questo file
├── index.js          # Entry point
├── references/       # Docs finanza
│   └── categories.md # Categorie spese
├── scripts/          # Import scripts
│   └── import-csv.js # Import da CSV
└── assets/           # Templates report
    └── report.html   # Template HTML report
```

## 🔧 Dependencies

- `axios ^1.5.0` - HTTP client
- `date-fns ^2.30.0` - Date manipulation

## 💡 Tips

- Collega la tua banca via API per tracking automatico
- Usa import CSV per dati storici
- Configura notifiche per spese anomale

## 🤝 Contributing

Contributi benvenuti! Vedi [CONTRIBUTING.md](../../CONTRIBUTING.md)

## 📄 License

MIT
