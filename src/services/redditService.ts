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
  selftext?: string;
  url?: string;
  thumbnail?: string;
  url_overridden_by_dest?: string;
  is_self?: boolean;
  is_video?: boolean;
  post_hint?: string;
  comments: RedditComment[];
  isNewlyFetched?: boolean;
};

// Define valid sort types
type SortType = 'hot' | 'new';

// For same-domain deployment, we can use a relative URL
// In development, we'll use the full URL from the environment variable
const API_BASE_URL = import.meta.env.DEV 
  ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api")
  : "/api"; // In production, use relative path

const fetchSubredditPosts = async (
  subreddit: string,
  limit?: number,
  sort: SortType = 'hot'
): Promise<RedditPost[]> => {
  try {
    // Fix URL construction to work with both absolute and relative paths
    let urlString = `${API_BASE_URL}/posts/${subreddit}`;
    
    // If it's a relative URL (starts with /), prepend the current origin
    const url = urlString.startsWith('/') 
      ? new URL(urlString, window.location.origin)
      : new URL(urlString);
    
    // Add limit parameter if provided
    if (limit) {
      url.searchParams.append('limit', limit.toString());
    }
    
    // Add sort parameter
    url.searchParams.append('sort', sort);
    
    const response = await fetch(url.toString(), {
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
export type { RedditPost, RedditComment, SortType };
