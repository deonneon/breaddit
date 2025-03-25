import { useState, useCallback, useEffect } from 'react';
import { fetchSubredditPosts } from '../services/redditService';
import type { RedditPost, SortType } from '../services/redditService';
import { useComments } from './useComments';

// Interface for storing cached posts by subreddit
interface CachedPosts {
  [key: string]: {
    posts: RedditPost[];
    timestamp: number;
  };
}

// Interface for storing sort preferences by subreddit
interface SubredditSortPreferences {
  [subreddit: string]: SortType;
}

// Default post limits for each subreddit
const DEFAULT_SUBREDDIT_POST_LIMITS: Record<string, number> = {
  thewallstreet: 3,
  stocks: 2,
  singularity: 8,
  localllama: 8,
  wallstreetbets: 8,
};

// Cache duration in milliseconds
const CACHE_DURATION = 1 * 60 * 1000; // 1 minute

export const useSubredditPosts = (initialSubreddit: string = 'thewallstreet') => {
  // State for posts and loading status
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState(initialSubreddit);
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [cachedPosts, setCachedPosts] = useState<CachedPosts>({});

  // Initialize sort preferences from localStorage
  const [sortPreferences, setSortPreferences] = useState<SubredditSortPreferences>(() => {
    const savedPreferences = localStorage.getItem('sortPreferences');
    return savedPreferences ? JSON.parse(savedPreferences) : {};
  });

  // Initialize read posts state from localStorage
  const [readPosts, setReadPosts] = useState<Record<string, number>>(() => {
    const savedReadPosts = localStorage.getItem('readPosts');
    return savedReadPosts ? JSON.parse(savedReadPosts) : {};
  });

  // Get the comments-related functionality from useComments hook
  const { 
    markNewComments, 
    collectCommentIds, 
    checkForNewComments,
    countNewComments
  } = useComments();

  // Function to get current sort preference for the active subreddit
  const getCurrentSortPreference = useCallback((): SortType => {
    return sortPreferences[subreddit] || sortPreferences['default'] || 'hot';
  }, [subreddit, sortPreferences]);

  // Function to mark a post as read
  const markPostAsRead = useCallback((postId: string) => {
    if (!readPosts[postId]) {
      const updatedReadPosts = {
        ...readPosts,
        [postId]: Date.now(), // Store current timestamp
      };
      setReadPosts(updatedReadPosts);
      localStorage.setItem('readPosts', JSON.stringify(updatedReadPosts));
    }
  }, [readPosts]);

  // Clean up old read posts after 2 days
  useEffect(() => {
    const cleanup = () => {
      const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
      const cachedPostsData = Object.values(cachedPosts);
      const allPostIds = new Set<string>();

      // Collect all current post IDs
      cachedPostsData.forEach((data) => {
        data.posts.forEach((post) => {
          allPostIds.add(post.permalink);
        });
      });

      // Create updated read posts object
      const updatedReadPosts: Record<string, number> = {};

      // Keep only posts that:
      // 1. Still exist in the cache AND
      // 2. Are less than 2 days old
      Object.entries(readPosts).forEach(([id, timestamp]) => {
        if (allPostIds.has(id) && timestamp > twoDaysAgo) {
          updatedReadPosts[id] = timestamp;
        }
      });

      // Only update if there were changes
      if (Object.keys(updatedReadPosts).length !== Object.keys(readPosts).length) {
        setReadPosts(updatedReadPosts);
        localStorage.setItem('readPosts', JSON.stringify(updatedReadPosts));
      }
    };

    cleanup();
    // Run cleanup every day
    const cleanupInterval = setInterval(cleanup, 24 * 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, [cachedPosts, readPosts]);

  // Function to refresh posts with a specific sort option
  const refreshPostsWithSort = useCallback(async (sort: SortType) => {
    try {
      setLoading(true);
      setError(null);

      const postLimit = DEFAULT_SUBREDDIT_POST_LIMITS[subreddit] || 4;
      const data = await fetchSubredditPosts(subreddit, postLimit, sort);

      // Mark posts as newly fetched
      const markedData = data.map((post) => ({
        ...post,
        isNewlyFetched: true,
      }));

      setPosts(markedData);
      setSelectedPostIndex(0); // Reset selected post when changing sort

      // Update cache with fresh data
      setCachedPosts((prev) => ({
        ...prev,
        [subreddit]: {
          posts: markedData,
          timestamp: Date.now(),
        },
      }));
    } catch (error) {
      setError(`Failed to refresh posts: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [subreddit]);

  // Function to update sort preference for a subreddit
  const updateSortPreference = useCallback((updateSubreddit: string, newSort: SortType) => {
    const updatedPreferences = {
      ...sortPreferences,
      [updateSubreddit]: newSort,
    };
    setSortPreferences(updatedPreferences);
    localStorage.setItem('sortPreferences', JSON.stringify(updatedPreferences));

    // Refresh posts if this is the currently viewed subreddit
    if (updateSubreddit === subreddit) {
      refreshPostsWithSort(newSort);
    }
  }, [sortPreferences, subreddit, refreshPostsWithSort]);

  // Function to update global sort preference
  const updateGlobalSortPreference = useCallback((newSort: SortType) => {
    // Set a default preference
    const updatedPreferences = { ...sortPreferences, 'default': newSort };
    setSortPreferences(updatedPreferences);
    localStorage.setItem('sortPreferences', JSON.stringify(updatedPreferences));

    // Refresh posts if the current subreddit doesn't have a specific preference
    if (!sortPreferences[subreddit]) {
      refreshPostsWithSort(newSort);
    }
  }, [sortPreferences, subreddit, refreshPostsWithSort]);

  // Function to update sort preference for the current subreddit
  const updateCurrentSortPreference = useCallback((newSort: SortType) => {
    updateSortPreference(subreddit, newSort);
  }, [subreddit, updateSortPreference]);

  // Main function to fetch posts
  const handleFetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cachedData = cachedPosts[subreddit];
      const now = Date.now();
      const currentSort = getCurrentSortPreference();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        // We're using cached data - mark posts as not newly fetched
        // but still process for new comments compared to known comment IDs
        const markedData = cachedData.posts.map((post) => {
          // Process comments to mark any new ones based on the post's permalink
          const processedComments = markNewComments(post.comments, post.permalink);

          return {
            ...post,
            isNewlyFetched: false,
            comments: processedComments,
          };
        });

        setPosts(markedData);
        setLoading(false);
        return;
      }

      // Get the post limit for the current subreddit or use default of 4
      const postLimit = DEFAULT_SUBREDDIT_POST_LIMITS[subreddit] || 4;
      const data = await fetchSubredditPosts(subreddit, postLimit, currentSort);

      // Process each post to mark new comments and store seen comment IDs
      const processedData = data.map((post) => {
        // Check if we've seen comments from this post before
        const postPermalink = post.permalink;

        // Process to mark new comments (and build a list of all comments)
        const processedComments = markNewComments(post.comments, postPermalink);

        // Get all comment IDs for this post
        const allCommentIds = collectCommentIds(post.comments);

        // Check if this post has any new comments (only possible for posts we've seen before)
        const hasNewComments = checkForNewComments(processedComments);

        // Store update info for applying after render
        post._updateInfo = {
          hasNewComments,
          allCommentIds,
        };

        return {
          ...post,
          isNewlyFetched: true,
          comments: processedComments,
        };
      });

      // Ensure we're only using the latest data from the server
      setPosts(processedData);
      setSelectedPostIndex(0); // Reset selected post when changing subreddit

      // Update cache with only the latest data from the server
      setCachedPosts((prev) => ({
        ...prev,
        [subreddit]: {
          posts: processedData,
          timestamp: now,
        },
      }));
    } catch (error) {
      setError(`Failed to fetch posts: ${error instanceof Error ? error.message : "Unknown error"} Please try again in a few minutes.`);
    } finally {
      setLoading(false);
    }
  }, [
    subreddit,
    cachedPosts,
    getCurrentSortPreference,
    markNewComments,
    collectCommentIds,
    checkForNewComments,
  ]);

  // Force refresh posts for the current subreddit
  const refreshPosts = useCallback(async () => {
    const currentSort = getCurrentSortPreference();
    try {
      setLoading(true);
      setError(null);

      const data = await fetchSubredditPosts(subreddit, undefined, currentSort);

      // Process each post to mark new comments and store seen comment IDs
      const now = Date.now();

      // Store all processed posts with potential new comments
      const processedData = data.map((post) => {
        // Check if we've seen comments from this post before
        const postPermalink = post.permalink;

        // Mark new comments based on what we've seen before
        const processedComments = markNewComments(post.comments, postPermalink);

        // Get the full list of comment IDs from this refresh
        const allCommentIds = collectCommentIds(post.comments);

        // Check if this post has any new comments
        const hasNewComments = checkForNewComments(processedComments);

        // Store update info for applying after render
        post._updateInfo = {
          hasNewComments,
          allCommentIds,
        };

        return {
          ...post,
          isNewlyFetched: true,
          comments: processedComments,
        };
      });

      // Update UI with the processed posts first
      setPosts(processedData);

      // Update cache with fresh data
      setCachedPosts((prev) => ({
        ...prev,
        [subreddit]: {
          posts: processedData,
          timestamp: now,
        },
      }));
    } catch (error) {
      setError(`Failed to refresh posts: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [
    subreddit,
    getCurrentSortPreference,
    markNewComments,
    collectCommentIds,
    checkForNewComments,
  ]);


  // Fetch posts when subreddit changes
  useEffect(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

  return {
    posts,
    loading,
    error,
    subreddit,
    setSubreddit,
    selectedPostIndex,
    setSelectedPostIndex,
    markPostAsRead,
    readPosts,
    getCurrentSortPreference,
    refreshPostsWithSort,
    updateSortPreference,
    updateGlobalSortPreference,
    updateCurrentSortPreference,
    sortPreferences,
    refreshPosts,
  };
}; 