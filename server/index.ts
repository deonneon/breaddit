// server.ts
import express from "express";
import dotenv from "dotenv";
import snoowrap from "snoowrap";
import cors from "cors";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT!,
  clientId: process.env.REDDIT_CLIENT_ID!,
  clientSecret: process.env.REDDIT_CLIENT_SECRET!,
  username: process.env.REDDIT_USERNAME!,
  password: process.env.REDDIT_PASSWORD!,
});

// Add CORS middleware
app.use(
  cors({
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Add this interface at the top of the file
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
 * For brevity, this example processes only top-level comments.
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
  // Fetch the 2 hottest posts
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
        comments,
      };
    })
  );

  return postsData;
}

// Create an API endpoint to serve subreddit posts
app.get("/api/posts/:subreddit", async (req, res) => {
  const subreddit = req.params.subreddit;
  try {
    const data = await fetchSubredditData(subreddit);
    res.json(data);
  } catch (error) {
    console.error("Error fetching subreddit data:", error);
    res.status(500).json({ error: "Error fetching subreddit data" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
