# Gmail Node API Categories Reference

## Category Labels

Gmail uses the following standard labels:

- **INBOX** - Main inbox
- **SENT** - Sent mail
- **DRAFT** - Drafts
- **SPAM** - Spam folder
- **TRASH** - Deleted items
- **UNREAD** - Unread messages
- **STARRED** - Starred messages
- **IMPORTANT** - Important messages

## Custom Labels

You can create custom labels for organization:

```javascript
const customLabels = {
  work: 'Label_Work',
  personal: 'Label_Personal',
  newsletters: 'Label_Newsletters',
  receipts: 'Label_Receipts'
};
```

## Search Queries

### By Sender
```
from:john@example.com
```

### By Subject
```
subject:"Meeting"
```

### By Date
```
after:2026/01/01
before:2026/12/31
```

### Complex Queries
```
from:boss@company.com subject:urgent is:unread
```
