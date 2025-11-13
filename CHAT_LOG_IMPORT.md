# Chat Log Import Instructions

This guide will help you import your EverWebinar chat log into your current webinar.

## Steps:

### 1. Place the CSV file in the project root
Move your `chat_log_141.csv` file to the project root directory:
```
/Volumes/WD/CODE/Webinar Play 2/chat_log_141.csv
```

### 2. Install required package
```bash
npm install csv-parser
```

### 3. Run the import script
```bash
npx tsx scripts/import-chat-log.ts
```

## What the script does:

1. ✅ Finds your current webinar in the database
2. 🗑️ Removes any existing scripted messages
3. 📖 Reads the CSV file (expecting columns: name, message, time)
4. 💾 Imports all messages as scripted chat messages with timestamps
5. ✅ Sets all messages as pre-approved

## CSV Format Expected:

The script expects a CSV with these columns:
- **name**: The sender's name
- **message**: The chat message content
- **time**: Timestamp in format "HH:MM:SS" or "MM:SS"

Example:
```csv
name,message,time
John Doe,Hello everyone!,00:02:15
Jane Smith,Great presentation!,00:05:30
```

## After Import:

The chat messages will:
- Be linked to your webinar
- Have `isScripted: true`
- Have `isApproved: true`
- Contain the exact timestamp from the CSV
- Display during live webinars at the specified times

## Troubleshooting:

- **File not found**: Make sure `chat_log_141.csv` is in the project root
- **No webinar found**: Make sure you have at least one webinar in the database
- **Import errors**: Check that your CSV matches the expected format
