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
  [key: string]: SortType;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Default post limits by subreddit
const DEFAULT_SUBREDDIT_POST_LIMITS: Record<string, number> = {
  'thewallstreet': 3,
  'stocks': 6,
  'wallstreetbets': 6,
  'singularity': 6,
  'localllama': 6,
  // Default for other subreddits
  'default': 6
};

export const useSubredditPosts = (initialSubreddit: string) => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get initial state from URL parameters if available
  const getInitialStateFromURL = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subredditParam = params.get('subreddit');
      const postIndexParam = params.get('post');
      
      return {
        subreddit: subredditParam || initialSubreddit,
        postIndex: postIndexParam ? parseInt(postIndexParam, 10) : 0
      };
    }
    
    return { subreddit: initialSubreddit, postIndex: 0 };
  };
  
  const initialState = getInitialStateFromURL();
  const [subreddit, setSubreddit] = useState(initialState.subreddit);
  const [selectedPostIndex, setSelectedPostIndex] = useState(initialState.postIndex);
  const [cachedPosts, setCachedPosts] = useState<CachedPosts>({});

  // Update URL parameters when subreddit or selectedPostIndex changes
  const updateURLParams = useCallback((newSubreddit: string, newPostIndex: number) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('subreddit', newSubreddit);
      url.searchParams.set('post', newPostIndex.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Wrap the original setSubreddit to also update URL
  const setSubredditWithURL = useCallback((newSubreddit: string) => {
    setSubreddit(newSubreddit);
    updateURLParams(newSubreddit, 0); // Reset post index when changing subreddit
  }, [updateURLParams]);

  // Wrap the original setSelectedPostIndex to also update URL
  const setSelectedPostIndexWithURL = useCallback((newIndex: number) => {
    setSelectedPostIndex(newIndex);
    updateURLParams(subreddit, newIndex);
  }, [subreddit, updateURLParams]);

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

      const postLimit = DEFAULT_SUBREDDIT_POST_LIMITS[subreddit] || DEFAULT_SUBREDDIT_POST_LIMITS.default;
      const data = await fetchSubredditPosts(subreddit, postLimit, sort);

      // Process each post for improved comment handling
      const processedData = data.map((post) => {
        // Process comments to mark which ones are new using markNewComments
        const processedComments = markNewComments(post.comments, post.permalink);
        
        // Count new comments
        const newCommentsCount = countNewComments(post.comments, post.permalink);
        
        return {
          ...post,
          isNewlyFetched: true,
          comments: processedComments,
          _newCommentsCount: newCommentsCount,
          _hasNewComments: newCommentsCount > 0
        };
      });

      setPosts(processedData);
      // Keep selected post index when refreshing with new sort
      const currentIndex = Math.min(selectedPostIndex, processedData.length - 1);
      if (currentIndex !== selectedPostIndex) {
        setSelectedPostIndexWithURL(currentIndex);
      }

      // Update cache with fresh data
      setCachedPosts((prev) => ({
        ...prev,
        [subreddit]: {
          posts: processedData,
          timestamp: Date.now(),
        },
      }));
    } catch (error) {
      setError(`Failed to refresh posts: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }, [subreddit, selectedPostIndex, markNewComments, countNewComments, setSelectedPostIndexWithURL]);

  // Function to update sort preference for a subreddit
  const updateSortPreference = useCallback((updateSubreddit: string, newSort: SortType) => {
    const updatedPreferences = {
      ...sortPreferences,
      [updateSubreddit]: newSort,
    };
    setSortPreferences(updatedPreferences);
    localStorage.setItem('sortPreferences', JSON.stringify(updatedPreferences));

    // Refresh posts if this is the current subreddit
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
        // We're using cached data - need to re-process comments for new status
        const markedData = cachedData.posts.map((post) => {
          // Re-process comments to update which ones are new
          const processedComments = markNewComments(post.comments, post.permalink);
          
          // Update new comments count
          const newCommentsCount = countNewComments(post.comments, post.permalink);
          
          return {
            ...post,
            isNewlyFetched: false,
            comments: processedComments,
            _newCommentsCount: newCommentsCount,
            _hasNewComments: newCommentsCount > 0
          };
        });

        setPosts(markedData);
        
        // If the selected post index is out of bounds, adjust it
        if (selectedPostIndex >= markedData.length) {
          setSelectedPostIndexWithURL(Math.max(0, markedData.length - 1));
        }
        
        setLoading(false);
        return;
      }

      // Get the post limit for the current subreddit or use default
      const postLimit = DEFAULT_SUBREDDIT_POST_LIMITS[subreddit] || DEFAULT_SUBREDDIT_POST_LIMITS.default;
      const data = await fetchSubredditPosts(subreddit, postLimit, currentSort);

      // Process each post with comments
      const processedData = data.map((post) => {
        // Process comments to mark which ones are new
        const processedComments = markNewComments(post.comments, post.permalink);
        
        // Get all comment IDs for this post
        const allCommentIds = collectCommentIds(post.comments);
        
        // Count new comments
        const newCommentsCount = countNewComments(post.comments, post.permalink);

        return {
          ...post,
          isNewlyFetched: true,
          comments: processedComments,
          _newCommentsCount: newCommentsCount,
          _hasNewComments: newCommentsCount > 0,
          _commentCount: allCommentIds.length,
        };
      });

      // Ensure we're only using the latest data from the server
      setPosts(processedData);
      
      // Keep the current post index if possible, otherwise reset it
      const validIndex = Math.min(selectedPostIndex, processedData.length - 1);
      if (validIndex !== selectedPostIndex) {
        setSelectedPostIndexWithURL(validIndex);
      }

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
    selectedPostIndex,
    getCurrentSortPreference,
    markNewComments,
    collectCommentIds,
    countNewComments,
    setSelectedPostIndexWithURL,
  ]);

  // Force refresh posts for the current subreddit
  const refreshPosts = useCallback(async () => {
    const currentSort = getCurrentSortPreference();
    try {
      setLoading(true);
      setError(null);

      const postLimit = DEFAULT_SUBREDDIT_POST_LIMITS[subreddit] || DEFAULT_SUBREDDIT_POST_LIMITS.default;
      const data = await fetchSubredditPosts(subreddit, postLimit, currentSort);

      // Process each post with comments
      const now = Date.now();
      
      // Store all processed posts
      const processedData = data.map((post) => {
        // Process comments to mark which ones are new
        const processedComments = markNewComments(post.comments, post.permalink);
        
        // Get the full list of comment IDs
        const allCommentIds = collectCommentIds(post.comments);
        
        // Count new comments
        const newCommentsCount = countNewComments(post.comments, post.permalink);

        return {
          ...post,
          isNewlyFetched: true,
          comments: processedComments,
          _newCommentsCount: newCommentsCount,
          _hasNewComments: newCommentsCount > 0,
          _commentCount: allCommentIds.length,
        };
      });

      // Update UI with the processed posts first
      setPosts(processedData);
      
      // Keep the current post index if possible, otherwise adjust it
      const validIndex = Math.min(selectedPostIndex, processedData.length - 1);
      if (validIndex !== selectedPostIndex) {
        setSelectedPostIndexWithURL(validIndex);
      }

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
    selectedPostIndex,
    getCurrentSortPreference,
    markNewComments,
    collectCommentIds,
    countNewComments,
    setSelectedPostIndexWithURL,
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
    setSubreddit: setSubredditWithURL,
    selectedPostIndex,
    setSelectedPostIndex: setSelectedPostIndexWithURL,
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