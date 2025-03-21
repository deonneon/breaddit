# Breaddit - Your Personal Reddit Stream

Breaddit is a modern, personalized Reddit stream application built with React, TypeScript, and Vite. It allows you to browse and follow your favorite subreddits in a clean, distraction-free interface.

## Features

- Browse posts from your favorite subreddits
- View comments and discussions in a clean, threaded interface
- Cache recent posts for faster loading
- Responsive design that works on desktop and mobile
- Dark mode support

## Data Storage and Caching

Breaddit uses localStorage to persist your reading history and preferences:

### Thread and Comment Storage

- **Read Posts**: The app tracks which posts you've read and when. Posts older than 2 days are automatically removed from storage during a daily cleanup.
- **Seen Comments**: Comment IDs you've already viewed are stored to help identify new comments when you revisit a thread.
- **Sort Preferences**: Your preferred sorting method (hot/new) is saved for each subreddit.

### Expiration Mechanisms

- **Post History**: Read posts are cleaned up if they are:
  - Older than 2 days, or
  - No longer visible in any of your cached subreddits (they've fallen off the front page)
- **New Comment Indicators**: New comments are highlighted for 30 seconds before being marked as "seen"
- **Post Cache**: Fresh post data is fetched only after the 1-minute cache duration expires to reduce API calls

This design keeps localStorage clean while maintaining your recent browsing history.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **API Integration**: Reddit API via Snoowrap
- **Build Tools**: Vite, ESLint, TypeScript

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Reddit API credentials

### Installation

1. Clone the repository

   ```
   git clone https://github.com/yourusername/breaddit.git
   cd breaddit
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your Reddit API credentials (see `.env.example` for reference)

4. Start the development server
   ```
   npm run dev
   ```

## Deployment

This project is configured for easy deployment on Vercel. See `VERCEL_DEPLOYMENT.md` for detailed instructions.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
