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

// Rate limiting constants
const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests
let lastRequestTime = 0;

// Helper function to ensure we don't exceed rate limits
const throttledFetch = async (url: URL, options: RequestInit = {}): Promise<Response> => {
  const now = Date.now();
  const timeElapsed = now - lastRequestTime;
  
  // If we've made a request recently, wait before making another
  if (timeElapsed < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeElapsed));
  }
  
  // Update the last request time
  lastRequestTime = Date.now();
  
  // Make the fetch request
  return fetch(url.toString(), options);
};

// Function to get lightweight post data without full comments
const getPostMetadata = async (
  subreddit: string,
  limit?: number,
  sort: SortType = "hot"
): Promise<{ id: string; num_comments: number }[]> => {
  try {
    // Build URL for metadata-only request
    const urlString = `${API_BASE_URL}/postInfo/${subreddit}`;
    const url = urlString.startsWith("/")
      ? new URL(urlString, window.location.origin)
      : new URL(urlString);
    
    if (limit) {
      url.searchParams.append("limit", limit.toString());
    }
    url.searchParams.append("sort", sort);
    
    const response = await throttledFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching post metadata:", error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

// Function to fetch a single post with comments
const fetchSinglePost = async (
  postId: string,
  commentLimit?: number
): Promise<RedditPost> => {
  try {
    const urlString = `${API_BASE_URL}/post/${postId}`;
    const url = urlString.startsWith("/")
      ? new URL(urlString, window.location.origin)
      : new URL(urlString);
    
    if (commentLimit) {
      url.searchParams.append("commentLimit", commentLimit.toString());
    }
    
    const response = await throttledFetch(url, {
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`Error fetching post ${postId}:`, error);
    throw error instanceof Error ? error : new Error("Unknown error occurred");
  }
};

// Smarter version of fetchSubredditPosts that prevents rate limiting
const fetchSubredditPosts = async (
  subreddit: string,
  limit?: number,
  sort: SortType = "hot",
  commentLimit?: number,
  retryCount = 0
): Promise<RedditPost[]> => {
  try {
    // First approach: Try getting post metadata to check sizes
    if (retryCount === 0) {
      try {
        // Get metadata for posts to determine comment size
        const postMetadata = await getPostMetadata(subreddit, limit, sort);
        
        // Collect posts with adaptive comment limits
        const posts: RedditPost[] = [];
        let rateLimited = false;
        
        // Sort posts by comment count to fetch smaller ones first
        const sortedPosts = [...postMetadata].sort((a, b) => a.num_comments - b.num_comments);
        
        for (const post of sortedPosts) {
          if (rateLimited) break;
          
          // Calculate appropriate comment limit based on post size
          let adaptiveCommentLimit = commentLimit;
          if (!adaptiveCommentLimit) {
            if (post.num_comments > 500) {
              adaptiveCommentLimit = 100; // Very large post
            } else if (post.num_comments > 200) {
              adaptiveCommentLimit = 150; // Large post
            } else if (post.num_comments > 50) {
              adaptiveCommentLimit = 200; // Medium post
            }
            // Small posts get full comments
          }
          
          try {
            // Fetch the post with appropriate comment limit
            const fullPost = await fetchSinglePost(post.id, adaptiveCommentLimit);
            posts.push(fullPost);
          } catch (error) {
            if (error instanceof Error && error.message.includes("429")) {
              // Hit rate limit, stop fetching more posts
              rateLimited = true;
              console.warn("Rate limited during post fetching, returning posts collected so far");
            } else {
              // Log other errors but continue with remaining posts
              console.error(`Error fetching post ${post.id}:`, error);
            }
          }
        }
        
        // If we got at least some posts, return them
        if (posts.length > 0) {
          return posts;
        }
        
        // If we couldn't get any posts this way, fall back to the standard approach
        console.warn("Metadata approach yielded no posts, falling back to standard approach");
      } catch (error) {
        console.warn("Metadata approach failed, falling back to standard approach:", error);
      }
    }
    
    // Standard approach as fallback
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

    const response = await throttledFetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      // If we got rate limited
      if (response.status === 429) {
        console.warn("Rate limited by API, waiting before retry");
        // Wait longer before retrying
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
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
