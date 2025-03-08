# Breaddit - Your Personal Reddit Stream

Breaddit is a modern, personalized Reddit stream application built with React, TypeScript, and Vite. It allows you to browse and follow your favorite subreddits in a clean, distraction-free interface.

## Features

- Browse posts from your favorite subreddits
- View comments and discussions in a clean, threaded interface
- Cache recent posts for faster loading
- Responsive design that works on desktop and mobile
- Dark mode support

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
