# HackerNews Top 100 Chrome Extension

A Chrome extension that shows today's top 100 HackerNews stories. It fetches data hourly, stores it in Appwrite, and presents it to users in a clean interface.

## Features

- Displays top 100 HackerNews stories
- Updates hourly in the background
- Stores data in Appwrite for persistence
- Search and filter functionality
- Sort by score, time, title, or comment count
- Clean, responsive UI styled after HackerNews

## Setup

### 1. Appwrite Setup

1. Create an account on [Appwrite](https://appwrite.io/) if you don't have one
2. Create a new project in the Appwrite Console
3. Create a new database
4. Create a new collection with the following attributes:
   - `title` (string)
   - `url` (string)
   - `score` (integer)
   - `by` (string)
   - `time` (integer)
   - `descendants` (integer)
   - `id` (integer)
   - `fetchDate` (string)
5. Set appropriate read/write permissions for your collection
6. Note down your:
   - Appwrite Endpoint (typically `https://cloud.appwrite.io/v1`)
   - Project ID
   - Database ID
   - Collection ID

### 2. Extension Configuration

1. Open `appwrite.js` and replace the placeholder values with your actual Appwrite credentials:
   ```javascript
   const APPWRITE_ENDPOINT = 'https://cloud.appwrite.io/v1';
   const APPWRITE_PROJECT_ID = 'your-project-id'; // Replace with your Appwrite project ID
   const APPWRITE_DATABASE_ID = 'your-database-id'; // Replace with your database ID 
   const APPWRITE_COLLECTION_ID = 'your-collection-id'; // Replace with your collection ID
   ```

### 3. Icons Setup

Replace the placeholder icon files in the `icons` directory with actual icons. You need:
- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

You can use the HackerNews orange color (#ff6600) for the icons.

### 4. Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" using the toggle in the top-right corner
3. Click "Load unpacked" and select the extension directory
4. The extension should now appear in your extensions list and in the toolbar

## Usage

- Click on the extension icon in your toolbar to see the top HackerNews stories
- Use the search box to filter stories by title or author
- Use the dropdown to sort stories by different criteria
- Click the "Refresh" button to manually refresh the stories

## How It Works

1. When installed, the extension schedules an hourly task to fetch the top stories from HackerNews API
2. The stories are stored in your Appwrite database with today's date
3. When you open the popup, it fetches the stories from Appwrite
4. Old stories (older than 7 days) are automatically cleaned up

## Development

To make changes to the extension:
1. Modify the code as needed
2. If you change the background script, you may need to reload the extension on the `chrome://extensions/` page
3. For popup changes, just close and reopen the popup

## Troubleshooting

- If stories are not loading, check your Appwrite credentials in `appwrite.js`
- Ensure your Appwrite collection has the correct structure
- Check the browser console for any error messages

## License

MIT
