import { VercelRequest, VercelResponse } from "@vercel/node";
import snoowrap from "snoowrap";
import * as dotenv from "dotenv";

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

// Define additional properties for Reddit submissions
interface RedditSubmissionExtras {
  url_overridden_by_dest?: string;
  post_hint?: string;
}

// Define valid sort types
type SortType = "hot" | "new";

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
async function fetchSubredditData(
  subredditName: string,
  limit: number = 4,
  sort: SortType = "hot"
) {
  const subreddit = reddit.getSubreddit(subredditName);

  // Fetch posts based on the sort parameter
  let submissions;
  if (sort === "new") {
    submissions = await subreddit.getNew({ limit });
  } else {
    // Default to hot
    submissions = await subreddit.getHot({ limit });
  }

  const postsData = await Promise.all(
    submissions.map(async (submission) => {
      // Cast submission to include additional properties
      const extendedSubmission = submission as snoowrap.Submission &
        RedditSubmissionExtras;

      // Fetch all top-level comments (expanding "more comments")
      const commentsListing = await submission.comments.fetchMore({
        amount: 100,
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
        url: submission.url,
        thumbnail: submission.thumbnail,
        url_overridden_by_dest: extendedSubmission.url_overridden_by_dest,
        is_self: submission.is_self,
        is_video: submission.is_video,
        post_hint: extendedSubmission.post_hint,
        comments,
      };
    })
  );

  return postsData;
}

// Vercel serverless function handler
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  // Allow requests from the same domain and localhost for development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle OPTIONS request (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { subreddit } = req.query;

  if (!subreddit || typeof subreddit !== "string") {
    return res.status(400).json({ error: "Subreddit parameter is required" });
  }

  // Parse the limit parameter if provided, otherwise use default
  const limit = req.query.limit
    ? parseInt(req.query.limit as string)
    : undefined;

  // Get sort parameter with default to 'hot'
  const sort = (req.query.sort as SortType) || "hot";

  // Validate sort parameter
  if (sort !== "hot" && sort !== "new") {
    return res
      .status(400)
      .json({ error: "Sort parameter must be either 'hot' or 'new'" });
  }

  try {
    const data = await fetchSubredditData(subreddit, limit, sort);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching subreddit data:", error);
    return res.status(500).json({ error: "Error fetching subreddit data" });
  }
}
