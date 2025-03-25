type RedditComment = {
  id: string;
  author: string;
  created_utc: number;
  body: string;
  replies?: RedditComment[];
  isNew?: boolean;
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
  _updateInfo?: {
    hasNewComments: boolean;
    allCommentIds: string[];
  };
};

// Define valid sort types
type SortType = "hot" | "new";

// For same-domain deployment, we can use a relative URL
// In development, we'll use the full URL from the environment variable
const API_BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api"
  : "/api"; // In production, use relative path

const fetchSubredditPosts = async (
  subreddit: string,
  limit?: number,
  sort: SortType = "hot",
  commentLimit?: number,
  retryCount = 0
): Promise<RedditPost[]> => {
  try {
    // Fix URL construction to work with both absolute and relative paths
    const urlString = `${API_BASE_URL}/posts/${subreddit}`;

    // If it's a relative URL (starts with /), prepend the current origin
    const url = urlString.startsWith("/")
      ? new URL(urlString, window.location.origin)
      : new URL(urlString);

    // Add limit parameter if provided
    if (limit) {
      url.searchParams.append("limit", limit.toString());
    }

    // Add sort parameter
    url.searchParams.append("sort", sort);
    
    // Add comment limit parameter if provided
    if (commentLimit) {
      url.searchParams.append("commentLimit", commentLimit.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If this is our first or second retry attempt
      if (retryCount < 2) {
        let newLimit = limit;
        let newCommentLimit = commentLimit;
        
        // Strategy 1: Reduce post limit if it's set and above minimum
        if (limit && limit > 5) {
          newLimit = Math.floor(limit / 2);
        }
        
        // Strategy 2: Reduce comment limit if it's set, or set a default comment limit if none was set
        if (commentLimit && commentLimit > 10) {
          newCommentLimit = Math.floor(commentLimit / 2);
        } else if (!commentLimit) {
          // If no comment limit was set initially, add one for the retry
          newCommentLimit = 50;
        }
        
        console.warn(
          `Fetch failed, retrying with ${newLimit !== limit ? 'reduced post limit ' + newLimit : 'same post limit'} and ${
            newCommentLimit ? (commentLimit ? 'reduced comment limit ' + newCommentLimit : 'added comment limit ' + newCommentLimit) : 'same settings'
          }`
        );
        
        return fetchSubredditPosts(subreddit, newLimit, sort, newCommentLimit, retryCount + 1);
      }
      
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
