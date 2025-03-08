type RedditComment = {
  id: string;
  author: string;
  created_utc: number;
  body: string;
  replies?: RedditComment[];
};

type RedditPost = {
  title: string;
  author: string;
  created_utc: number;
  permalink: string;
  comments: RedditComment[];
};

// For same-domain deployment, we can use a relative URL
// In development, we'll use the full URL from the environment variable
const API_BASE_URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api")
  : "/api"; // In production, use relative path

const fetchSubredditPosts = async (
  subreddit: string
): Promise<RedditPost[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/posts/${subreddit}`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(errorData || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching subreddit posts:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

export { fetchSubredditPosts };
export type { RedditPost, RedditComment };
