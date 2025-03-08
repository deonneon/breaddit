# Deploying to Vercel

This document provides instructions on how to deploy your Reddit API and frontend application to Vercel as a single project.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. [Vercel CLI](https://vercel.com/docs/cli) installed (optional, for local development)
3. Your Reddit API credentials

## Setting Up Environment Variables

Before deploying, you need to set up your Reddit API credentials as Vercel environment variables. You can do this in the Vercel dashboard:

1. Go to your project settings in the Vercel dashboard
2. Navigate to the "Environment Variables" tab
3. Add the following environment variables:
   - `REDDIT_USER_AGENT`
   - `REDDIT_CLIENT_ID`
   - `REDDIT_CLIENT_SECRET`
   - `REDDIT_USERNAME`
   - `REDDIT_PASSWORD`

## Deployment

### Option 1: Deploy from the Vercel Dashboard

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import your project in the Vercel dashboard
3. Configure the project settings
4. Deploy

### Option 2: Deploy using Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Login to Vercel: `vercel login`
3. Deploy: `vercel`

## Monorepo Structure

This project is set up as a monorepo, with both the frontend and API deployed to the same Vercel project:

- The frontend is built using Vite and deployed as a static site
- The API is deployed as serverless functions in the `/api` directory

The `vercel.json` file is configured to:
1. Build the frontend from the root package.json
2. Deploy the API functions from the `/api` directory
3. Set up routes to handle both frontend and API requests

## Testing Your Deployment

After deployment, your application will be available at:

```
https://your-vercel-domain.vercel.app
```

And your API will be available at:

```
https://your-vercel-domain.vercel.app/api/posts/[subreddit]
```

For example, to get posts from the "programming" subreddit:

```
https://your-vercel-domain.vercel.app/api/posts/programming
```

## Local Development

To test your Vercel functions locally:

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel dev`

This will start a local development server that simulates the Vercel environment.

## Troubleshooting

- **Function Timeout**: If your function times out, you may need to optimize your code or upgrade your Vercel plan for longer execution times.
- **Build Errors**: Make sure your build script in package.json is correctly set up for Vercel.
- **Missing Dependencies**: Make sure all required dependencies are listed in your package.json file. 