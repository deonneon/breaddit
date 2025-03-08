import { VercelRequest, VercelResponse } from '@vercel/node';
import snoowrap from 'snoowrap';
import * as dotenv from 'dotenv';


// Configure dotenv for ES modules
dotenv.config();

// Initialize Reddit API client
const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT!,
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
});

interface Comment {
  id: string;
  author: string;
  created_utc: number;
  body: string;
  replies: Comment[];
  depth: number;
}

/**
 * Recursively structure a comment and its replies.
 */
async function fetchComments(comment: snoowrap.Comment): Promise<Comment> {
  const replies =
    comment.replies && Array.isArray(comment.replies)
      ? await Promise.all(comment.replies.map((reply) => fetchComments(reply)))
      : [];

  return {
    id: comment.id,
    author:
      comment.author && comment.author.name ? comment.author.name : "[deleted]",
    created_utc: comment.created_utc,
    body: comment.body,
    replies,
    depth: comment.depth || 0,
  };
}

/**
 * Fetch posts and their comments from a given subreddit.
 */
async function fetchSubredditData(subredditName: string) {
  const subreddit = reddit.getSubreddit(subredditName);
  // Fetch the 4 hottest posts
  const submissions = await subreddit.getHot({ limit: 4 });

  const postsData = await Promise.all(
    submissions.map(async (submission) => {
      // Fetch all top-level comments (expanding "more comments")
      const commentsListing = await submission.comments.fetchMore({
        amount: Infinity,
        skipReplies: false,
      });
      const comments = await Promise.all(
        commentsListing.map(async (comment: snoowrap.Comment) =>
          fetchComments(comment)
        )
      );

      return {
        title: submission.title,
        author: submission.author.name,
        created_utc: submission.created_utc,
        permalink: submission.permalink,
        selftext: submission.selftext,
        comments,
      };
    })
  );

  return postsData;
}

// Vercel serverless function handler
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // Allow requests from the same domain and localhost for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subreddit } = req.query;
  
  if (!subreddit || typeof subreddit !== 'string') {
    return res.status(400).json({ error: 'Subreddit parameter is required' });
  }

  try {
    const data = await fetchSubredditData(subreddit);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching subreddit data:", error);
    return res.status(500).json({ error: "Error fetching subreddit data" });
  }
} 