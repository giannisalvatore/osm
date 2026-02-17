# Budget Analyzer Skill

Analizza automaticamente le tue spese e abbonamenti con AI-powered insights.

**Version:** 1.0.0  
**Author:** MarioDev  
**Repository:** https://github.com/mariodev/budget-analyzer

## Features

- 💰 Analisi automatica delle spese
- 📅 Rilevamento abbonamenti ricorrenti
- 📊 Breakdown per categoria
- 💡 Raccomandazioni personalizzate
- 🤖 AI-Verified skill

## Permissions

- `read_finance` - Accesso ai dati finanziari
- `read_calendar` - Accesso al calendario per date di rinnovo

## Dependencies

```json
{
  "axios": "^1.5.0",
  "date-fns": "^2.30.0"
}
```

## Installation

```bash
osm i budget-analyzer
```

## Usage

```javascript
import budgetAnalyzer from 'budget-analyzer';

// Full analysis
const insights = await budgetAnalyzer.execute('analyze');

// View subscriptions
const subs = await budgetAnalyzer.execute('subscriptions');

// View expenses
const expenses = await budgetAnalyzer.execute('expenses');
```

## API

### `execute(action, options)`

Executes the Budget Analyzer skill with the specified action.

**Actions:**
- `analyze` - Complete financial analysis with recommendations
- `subscriptions` - List all detected subscriptions
- `expenses` - List recent expenses

## Output Example

```
Total Spent: $479.25

Category Breakdown:
  groceries: $219.25
  utilities: $150.00
  dining: $65.00
  transport: $45.00

Subscriptions: 4 active
Monthly Cost: $79.23

Recommendations:
  1. [high] Aim to save at least 20% of your monthly income
  2. [medium] You're spending $79.23/month on subscriptions
```

## Integration

Connect with your bank's API or import CSV/Excel files for automatic expense tracking.

## License

MIT
