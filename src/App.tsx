// App.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSubredditPosts } from "./services/redditService";
import type {
  RedditPost,
  RedditComment,
  SortType,
} from "./services/redditService";
import Sidebar from "./components/Sidebar";
import Comment from "./components/Comment";
import LoadingSpinner from "./components/LoadingSpinner";
import NewCommentsModal from "./components/NewCommentsModal";
import { renderMarkdown } from "./utils/markdownUtils";

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const today = new Date();

  // Simple check if date is today by comparing date strings
  if (date.toDateString() === today.toDateString()) {
    return `Today at ${date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

// Interface for tracking seen comment IDs by post permalink
interface SeenComments {
  [postPermalink: string]: {
    commentIds: string[];
    lastFetchTime: number;
  };
}

const CACHE_DURATION = 1 * 60 * 1000; // 1 minute in milliseconds

const App = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState("thewallstreet");
  const [cachedPosts, setCachedPosts] = useState<CachedPosts>({});
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize seenComments from localStorage if available
  const [seenComments, setSeenComments] = useState<SeenComments>(() => {
    const savedSeenComments = localStorage.getItem("seenComments");
    return savedSeenComments ? JSON.parse(savedSeenComments) : {};
  });

  // Add state for sort preferences with localStorage persistence
  const [sortPreferences, setSortPreferences] =
    useState<SubredditSortPreferences>(() => {
      const savedPreferences = localStorage.getItem("sortPreferences");
      return savedPreferences ? JSON.parse(savedPreferences) : {};
    });

  // State for storing IDs of read posts with timestamps
  const [readPosts, setReadPosts] = useState<Record<string, number>>(() => {
    const savedReadPosts = localStorage.getItem("readPosts");
    return savedReadPosts ? JSON.parse(savedReadPosts) : {};
  });

  // Default subreddits that are always available
  const defaultSubreddits = [
    "thewallstreet",
    "stocks",
    "singularity",
    "localllama",
    "wallstreetbets",
  ];

  // Default post limits for each subreddit
  const subredditPostLimits: Record<string, number> = {
    thewallstreet: 3,
    stocks: 2,
    singularity: 8,
    localllama: 8,
    wallstreetbets: 8,
  };

  // Function to mark a post as read
  const markPostAsRead = useCallback(
    (postId: string) => {
      if (!readPosts[postId]) {
        const updatedReadPosts = {
          ...readPosts,
          [postId]: Date.now(), // Store current timestamp
        };
        setReadPosts(updatedReadPosts);
        localStorage.setItem("readPosts", JSON.stringify(updatedReadPosts));
      }
    },
    [readPosts]
  );

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
      if (
        Object.keys(updatedReadPosts).length !== Object.keys(readPosts).length
      ) {
        setReadPosts(updatedReadPosts);
        localStorage.setItem("readPosts", JSON.stringify(updatedReadPosts));
      }
    };

    cleanup();
    // Run cleanup every day
    const cleanupInterval = setInterval(cleanup, 24 * 60 * 60 * 1000);
    return () => clearInterval(cleanupInterval);
  }, [cachedPosts, readPosts]);

  // Function to get current sort preference for the active subreddit
  const getCurrentSortPreference = useCallback((): SortType => {
    return sortPreferences[subreddit] || "hot";
  }, [subreddit, sortPreferences]);

  // Function to update sort preference for a subreddit
  const updateSortPreference = useCallback(
    (newSort: SortType) => {
      const updatedPreferences = {
        ...sortPreferences,
        [subreddit]: newSort,
      };
      setSortPreferences(updatedPreferences);
      localStorage.setItem(
        "sortPreferences",
        JSON.stringify(updatedPreferences)
      );

      // Refresh posts with the new sort preference
      refreshPostsWithSort(newSort);
    },
    [subreddit, sortPreferences]
  );

  // Function to refresh posts with a specific sort option
  const refreshPostsWithSort = useCallback(
    async (sort: SortType) => {
      try {
        setLoading(true);
        setError(null);

        const postLimit = subredditPostLimits[subreddit] || 4;
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
        setError(
          `Failed to refresh posts: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setLoading(false);
      }
    },
    [subreddit]
  );

  // Helper function to recursively mark new comments by comparing with seen comments
  const markNewComments = useCallback(
    (comments: RedditComment[], postPermalink: string): RedditComment[] => {
      if (!comments || !Array.isArray(comments)) return [];

      // Check if this is the first time we're seeing this thread
      const isFirstTimeSeenThread = !seenComments[postPermalink];
      const postSeenComments = seenComments[postPermalink]?.commentIds || [];

      // Debug info
      console.log(`Marking comments for ${postPermalink}`, {
        totalComments: comments.length,
        knownCommentIds: postSeenComments.length,
        isFirstTimeSeenThread,
        seenCommentsKeys: Object.keys(seenComments),
      });

      return comments.map((comment) => {
        // Only mark as new if:
        // 1. This is NOT the first time we're seeing this thread AND
        // 2. This comment ID hasn't been seen before
        const isNew =
          !isFirstTimeSeenThread && !postSeenComments.includes(comment.id);

        // Recursively process replies
        const processedReplies = comment.replies
          ? markNewComments(comment.replies, postPermalink)
          : [];

        return {
          ...comment,
          isNew,
          replies: processedReplies,
        };
      });
    },
    [seenComments]
  );

  // Function to collect all comment IDs from a post
  const collectCommentIds = useCallback(
    (comments: RedditComment[]): string[] => {
      const ids: string[] = [];

      const processComment = (comment: RedditComment) => {
        if (!ids.includes(comment.id)) {
          ids.push(comment.id);
        }

        if (comment.replies && comment.replies.length > 0) {
          comment.replies.forEach(processComment);
        }
      };

      comments.forEach(processComment);
      return ids;
    },
    []
  );

  // Helper function to check if a comment thread has any new comments
  const checkForNewComments = useCallback(
    (comments: RedditComment[]): boolean => {
      if (!comments || !Array.isArray(comments)) return false;

      for (const comment of comments) {
        if (comment.isNew) return true;

        if (comment.replies && comment.replies.length > 0) {
          const hasNewReplies = checkForNewComments(comment.replies);
          if (hasNewReplies) return true;
        }
      }

      return false;
    },
    []
  );

  const handleFetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cachedData = cachedPosts[subreddit];
      const now = Date.now();
      const currentSort = getCurrentSortPreference();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for subreddit: ${subreddit}`);

        // We're using cached data - mark posts as not newly fetched
        // but still process for new comments compared to known comment IDs
        const markedData = cachedData.posts.map((post) => {
          console.log(`Using cached data for post: ${post.permalink}`);

          // Process comments to mark any new ones based on the post's permalink
          // This will highlight any new comments since last time we saw them
          const processedComments = markNewComments(
            post.comments,
            post.permalink
          );

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
      const postLimit = subredditPostLimits[subreddit] || 4;
      const data = await fetchSubredditPosts(subreddit, postLimit, currentSort);

      // Process each post to mark new comments and store seen comment IDs
      const processedData = data.map((post) => {
        // Check if we've seen comments from this post before
        const postPermalink = post.permalink;

        // Process to mark new comments (and build a list of all comments)
        const processedComments = markNewComments(post.comments, postPermalink);

        // Get all comment IDs for this post
        const allCommentIds = collectCommentIds(post.comments);

        // Check if this is the first time we're seeing this post
        const isFirstTimeSeenPost = !seenComments[postPermalink];

        // If this is the first time we're seeing this post, store its comments immediately
        // so future refreshes will be able to detect new comments
        if (isFirstTimeSeenPost) {
          setSeenComments((prev) => ({
            ...prev,
            [postPermalink]: {
              commentIds: allCommentIds,
              lastFetchTime: now,
            },
          }));
        }

        // Check if this post has any new comments (only possible for posts we've seen before)
        const hasNewComments =
          !isFirstTimeSeenPost && checkForNewComments(processedComments);

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

      // After a delay, only update seen comments for posts with new comments
      // (we already immediately updated first-time posts above)
      setTimeout(() => {
        processedData.forEach((post) => {
          if (post._updateInfo?.hasNewComments) {
            const postPermalink = post.permalink;
            const allCommentIds = post._updateInfo.allCommentIds;

            setSeenComments((prev) => {
              // Don't lose track of what we already know about this post's comments
              const existingIds = prev[postPermalink]?.commentIds || [];

              // Combine existing and new IDs without duplicates
              const mergedIds = [
                ...new Set([...existingIds, ...allCommentIds]),
              ];

              return {
                ...prev,
                [postPermalink]: {
                  commentIds: mergedIds,
                  lastFetchTime: now,
                },
              };
            });
          }
        });
      }, 30000); // 30 seconds delay
    } catch (error) {
      // Use the error parameter in the error message
      setError(
        `Failed to fetch posts: ${
          error instanceof Error ? error.message : "Unknown error"
        } Please try again in a few minutes.`
      );
    } finally {
      setLoading(false);
    }
  }, [
    subreddit,
    cachedPosts,
    getCurrentSortPreference,
    markNewComments,
    collectCommentIds,
    seenComments,
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

        // Get all comment IDs (both current and new)
        const currentIds = seenComments[postPermalink]?.commentIds || [];
        const isFirstTimeSeenPost = currentIds.length === 0;

        console.log(
          `Refreshing ${postPermalink}, current known IDs: ${currentIds.length}, first time: ${isFirstTimeSeenPost}`
        );

        // Mark new comments based on what we've seen before
        const processedComments = markNewComments(post.comments, postPermalink);

        // Get the full list of comment IDs from this refresh
        const allCommentIds = collectCommentIds(post.comments);

        // If this is the first time we're seeing this post, store its comments immediately
        if (isFirstTimeSeenPost) {
          setSeenComments((prev) => ({
            ...prev,
            [postPermalink]: {
              commentIds: allCommentIds,
              lastFetchTime: now,
            },
          }));
        }

        // Check if this post has any new comments (only possible for posts we've seen before)
        const hasNewComments =
          !isFirstTimeSeenPost && checkForNewComments(processedComments);

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

      // After a delay, update seenComments only for posts with new comments
      setTimeout(() => {
        processedData.forEach((post) => {
          if (post._updateInfo?.hasNewComments) {
            const postPermalink = post.permalink;
            const allCommentIds = post._updateInfo.allCommentIds;

            setSeenComments((prev) => ({
              ...prev,
              [postPermalink]: {
                commentIds: allCommentIds,
                lastFetchTime: now,
              },
            }));
          }
        });
      }, 30000); // 30 seconds delay
    } catch (error) {
      setError(
        `Failed to refresh posts: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [
    subreddit,
    getCurrentSortPreference,
    markNewComments,
    collectCommentIds,
    seenComments,
    checkForNewComments,
  ]);

  // Function to refresh just the comments for the current post
  const refreshComments = useCallback(async () => {
    if (!posts[selectedPostIndex]) return;

    try {
      // Get the current post's permalink and subreddit
      const currentPost = posts[selectedPostIndex];
      const postPermalink = currentPost.permalink;

      // Set loading state for comments only
      const tempPost = { ...currentPost, comments: [] };
      const updatedPosts = [...posts];
      updatedPosts[selectedPostIndex] = tempPost;
      setPosts(updatedPosts);

      // Fetch fresh data for the current subreddit to get updated comments
      const currentSort = getCurrentSortPreference();
      const postLimit = subredditPostLimits[subreddit] || 4;
      const freshData = await fetchSubredditPosts(
        subreddit,
        postLimit,
        currentSort
      );

      // Find the matching post in the fresh data
      const freshPost = freshData.find(
        (post) => post.permalink === postPermalink
      );

      if (freshPost) {
        // Check if this is the first time we're seeing this post's comments
        const currentIds = seenComments[postPermalink]?.commentIds || [];
        const isFirstTimeSeenPost = currentIds.length === 0;

        console.log(
          `Refreshing comments for ${postPermalink}, known IDs: ${currentIds.length}, first time: ${isFirstTimeSeenPost}`
        );

        // Process the comments to mark new ones
        const now = Date.now();
        const processedComments = markNewComments(
          freshPost.comments,
          postPermalink
        );

        // Get new complete list of comment IDs
        const allCommentIds = collectCommentIds(freshPost.comments);

        // If this is the first time we're seeing this post, store its comments immediately
        if (isFirstTimeSeenPost) {
          setSeenComments((prev) => ({
            ...prev,
            [postPermalink]: {
              commentIds: allCommentIds,
              lastFetchTime: now,
            },
          }));
        }

        // Update only the comments of the current post
        const updatedPost = {
          ...currentPost,
          comments: processedComments,
        };

        const updatedPostsWithComments = [...posts];
        updatedPostsWithComments[selectedPostIndex] = updatedPost;
        setPosts(updatedPostsWithComments);

        // Update the cache as well
        setCachedPosts((prev) => {
          const cachedSubredditPosts = prev[subreddit]?.posts || [];
          const updatedCachedPosts = cachedSubredditPosts.map((post) =>
            post.permalink === postPermalink ? updatedPost : post
          );

          return {
            ...prev,
            [subreddit]: {
              posts: updatedCachedPosts,
              timestamp: prev[subreddit]?.timestamp || now,
            },
          };
        });

        // Check for new comments, but only if we've seen this post before
        const countNewInComments = (comments: RedditComment[]): number => {
          let count = 0;
          if (!comments) return 0;

          for (const comment of comments) {
            if (comment.isNew) count++;
            if (comment.replies && comment.replies.length > 0) {
              count += countNewInComments(comment.replies);
            }
          }
          return count;
        };

        const newCommentsCount = countNewInComments(processedComments);
        if (!isFirstTimeSeenPost && newCommentsCount > 0) {
          // Could add a toast notification here
          console.log(`${newCommentsCount} new comments loaded`);

          // Add a delay before updating seenComments to allow user to see what's new
          // This will keep comments marked as "new" for 30 seconds
          setTimeout(() => {
            setSeenComments((prev) => ({
              ...prev,
              [postPermalink]: {
                commentIds: allCommentIds,
                lastFetchTime: now,
              },
            }));
          }, 30000); // 30 seconds delay
        } else {
          // For first-time posts, we already updated seenComments above
          // For posts with no new comments, update the lastFetchTime
          if (!isFirstTimeSeenPost) {
            setSeenComments((prev) => ({
              ...prev,
              [postPermalink]: {
                commentIds: allCommentIds,
                lastFetchTime: now,
              },
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing comments:", error);
      // If there's an error, fetch the entire post data again
      refreshPosts();
    }
  }, [
    posts,
    selectedPostIndex,
    subreddit,
    getCurrentSortPreference,
    subredditPostLimits,
    markNewComments,
    collectCommentIds,
    refreshPosts,
    seenComments,
    checkForNewComments,
  ]);

  const handleSubredditSelect = (selectedSubreddit: string) => {
    setSubreddit(selectedSubreddit);
    // Close sidebar on mobile after selecting a subreddit
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  useEffect(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add("overflow-hidden"); // Disable scrolling
    } else {
      document.body.classList.remove("overflow-hidden"); // Enable scrolling
    }
  }, [sidebarOpen]);

  // Add state to track if we should show the scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false);
  // Create a ref for the scrollable content container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Create a ref for an element at the top of the page (for intersection observer)
  const topMarkerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to detect when we've scrolled past the top
  useEffect(() => {
    // Only set up on mobile
    const isMobile = window.innerWidth < 768;
    if (!isMobile || !topMarkerRef.current) return;

    const options = {
      root: scrollContainerRef.current,
      threshold: 0,
      rootMargin: "-200px 0px 0px 0px", // Consider it "out of view" when 200px down
    };

    const observer = new IntersectionObserver((entries) => {
      // When topMarker is not intersecting, we've scrolled down
      const [entry] = entries;
      setShowScrollTop(!entry.isIntersecting);
      console.log("Intersection state:", !entry.isIntersecting);
    }, options);

    observer.observe(topMarkerRef.current);

    return () => {
      if (topMarkerRef.current) {
        observer.unobserve(topMarkerRef.current);
      }
    };
  }, []);

  // Function to scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Save seenComments to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("seenComments", JSON.stringify(seenComments));
  }, [seenComments]);

  const MainContent = () => {
    // Add a countdown timer for when new comments will be marked as seen
    const [countdown, setCountdown] = useState<number | null>(null);
    // Add state for new comments modal
    const [showNewCommentsModal, setShowNewCommentsModal] = useState(false);

    // Function to manually mark all comments as seen immediately
    const handleMarkAllSeen = () => {
      const postPermalink = posts[selectedPostIndex]?.permalink;
      if (postPermalink && seenComments[postPermalink]) {
        // Get all comment IDs from the current post
        const allCommentIds = collectCommentIds(
          posts[selectedPostIndex].comments
        );
        // Update seen comments immediately
        setSeenComments((prev) => ({
          ...prev,
          [postPermalink]: {
            commentIds: allCommentIds,
            lastFetchTime: Date.now(),
          },
        }));
        // Reset the countdown
        setCountdown(null);
      }
    };

    // Get the count of new comments for the selected post - only execute if posts are loaded
    const countNewComments = useCallback(() => {
      if (!posts[selectedPostIndex]) return 0;

      let count = 0;
      const countNew = (comments: RedditComment[]) => {
        if (!comments) return;

        for (const comment of comments) {
          if (comment.isNew) count++;
          if (comment.replies && comment.replies.length > 0) {
            countNew(comment.replies);
          }
        }
      };

      countNew(posts[selectedPostIndex].comments);
      return count;
    }, [posts, selectedPostIndex]);

    // Format the last fetch time - only execute if posts are loaded
    const getLastFetchTime = useCallback(() => {
      if (!posts[selectedPostIndex]) return null;
      const permalink = posts[selectedPostIndex].permalink;
      if (!permalink || !seenComments[permalink]) return null;

      const lastFetchTime = new Date(seenComments[permalink].lastFetchTime);
      return lastFetchTime.toLocaleTimeString();
    }, [posts, selectedPostIndex, seenComments]);

    // Calculate values only if posts are loaded
    const newCommentsCount =
      posts.length > 0 && selectedPostIndex < posts.length
        ? countNewComments()
        : 0;
    const lastFetchTime =
      posts.length > 0 && selectedPostIndex < posts.length
        ? getLastFetchTime()
        : null;

    // Start countdown when we have new comments
    useEffect(() => {
      if (newCommentsCount > 0) {
        // Only start the countdown for posts we've seen before - not for first loads
        const postPermalink = posts[selectedPostIndex]?.permalink;
        const isFirstTimeSeenPost = !(
          postPermalink && seenComments[postPermalink]?.commentIds?.length > 0
        );

        // Don't start countdown if modal is open
        if (!isFirstTimeSeenPost && !showNewCommentsModal) {
          setCountdown(30); // 30 seconds

          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer);
                return null;
              }
              return prev - 1;
            });
          }, 1000);

          return () => clearInterval(timer);
        } else if (showNewCommentsModal) {
          // Pause the countdown while modal is open
          setCountdown((prev) => prev || 30);
        }
      } else {
        setCountdown(null);
      }
    }, [
      newCommentsCount,
      posts.length > 0 ? posts[selectedPostIndex]?.permalink : null,
      seenComments,
      showNewCommentsModal, // Add dependency on modal state
    ]);

    // Handle opening the new comments modal
    const handleOpenNewCommentsModal = (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent event from bubbling up
      if (newCommentsCount > 0) {
        setShowNewCommentsModal(true);
      }
    };

    // Handle closing the new comments modal
    const handleCloseNewCommentsModal = (markAsSeen = false) => {
      setShowNewCommentsModal(false);

      // Mark all comments as seen if requested
      if (markAsSeen) {
        handleMarkAllSeen();
      } else {
        // Just resume countdown when modal closes without marking
        if (newCommentsCount > 0) {
          const postPermalink = posts[selectedPostIndex]?.permalink;
          const isFirstTimeSeenPost = !(
            postPermalink && seenComments[postPermalink]?.commentIds?.length > 0
          );

          if (!isFirstTimeSeenPost) {
            setCountdown(30);
          }
        }
      }
    };

    if (loading) {
      return (
        <div className="w-full h-full min-h-screen flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          </div>
        </div>
      );
    }

    if (posts.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              No posts found for r/{subreddit}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full p-4 md:p-8 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
        {/* Subreddit title, sort options, and refresh button - visible only on desktop */}
        <div className="hidden md:flex items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <span className="text-orange-500 mr-2">r/</span>
            {subreddit}
          </h1>

          {/* Sort options */}
          <div className="flex items-center ml-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => updateSortPreference("hot")}
              className={`px-3 py-1 text-sm rounded-l-lg transition-colors ${
                getCurrentSortPreference() === "hot"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="Sort by hot"
            >
              Hot
            </button>
            <button
              onClick={() => updateSortPreference("new")}
              className={`px-3 py-1 text-sm rounded-r-lg transition-colors ${
                getCurrentSortPreference() === "new"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label="Sort by new"
            >
              New
            </button>
          </div>

          <button
            onClick={refreshPosts}
            className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:rotate-180 duration-500"
            aria-label="Refresh posts"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {posts.map((post, index) => (
            <button
              key={post.permalink}
              onClick={() => {
                setSelectedPostIndex(index);
                markPostAsRead(post.permalink);
              }}
              className={`px-3 md:px-4 py-2 h-auto min-h-16 rounded-lg text-sm w-full text-left overflow-hidden transition-all duration-200 shadow-sm hover:shadow ${
                selectedPostIndex === index
                  ? `bg-orange-500 text-white shadow-md transform scale-[1.02] ${
                      post.isNewlyFetched && !readPosts[post.permalink]
                        ? "border-l-2 border-green-300"
                        : ""
                    }`
                  : post.isNewlyFetched && !readPosts[post.permalink]
                  ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-l-2 border-green-500"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label={`Select post "${post.title}${
                post.isNewlyFetched && !readPosts[post.permalink]
                  ? " (New)"
                  : ""
              }"`}
              title={post.title}
            >
              <div className="line-clamp-3">{post.title}</div>
            </button>
          ))}
        </div>

        <div className="space-y-8 pb-16 max-w-4xl mx-auto">
          <div
            key={posts[selectedPostIndex].permalink}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300"
          >
            <h5 className="text-md md:text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center">
              {posts[selectedPostIndex].title}
            </h5>

            <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">
              <div className="flex items-center mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span>
                  {posts[selectedPostIndex].author === "AutoModerator"
                    ? "AutoMod"
                    : posts[selectedPostIndex].author}
                </span>
              </div>

              <div className="flex items-center mr-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{formatDate(posts[selectedPostIndex].created_utc)}</span>
              </div>

              <a
                href={`https://reddit.com${posts[selectedPostIndex].permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
                aria-label={`View post "${posts[selectedPostIndex].title}" on Reddit`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
                <span>View on Reddit</span>
              </a>
            </div>

            {/* Display the submission body if it exists */}
            {posts[selectedPostIndex].selftext && (
              <div className="mt-2 mb-2 text-gray-800 dark:text-gray-200 break-words bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                {renderMarkdown(posts[selectedPostIndex].selftext.trimStart())}
              </div>
            )}

            {/* Display post image if it exists */}
            {!posts[selectedPostIndex].is_self && (
              <div className="mt-2 mb-2">
                {posts[selectedPostIndex].is_video ? (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                    <a
                      href={posts[selectedPostIndex].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View video on Reddit
                    </a>
                  </div>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-center">
                    <img
                      src={
                        posts[selectedPostIndex].url_overridden_by_dest ||
                        posts[selectedPostIndex].url
                      }
                      alt={posts[selectedPostIndex].title}
                      className="max-w-full h-auto rounded-md"
                      loading="lazy"
                      onError={(e) => {
                        // If image fails to load, show a link instead
                        const target = e.target as HTMLImageElement;
                        const container = target.parentElement;
                        if (container) {
                          container.innerHTML = `
                            <a 
                              href="${posts[selectedPostIndex].url}" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              class="text-blue-600 hover:underline"
                            >
                              View content on Reddit
                            </a>
                          `;
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="mt-3 md:mt-4 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-orange-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <span>Comments</span>
                  {newCommentsCount > 0 && (
                    <button
                      onClick={handleOpenNewCommentsModal}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setShowNewCommentsModal(true);
                        }
                      }}
                      className="ml-2 text-xs font-medium text-green-600 dark:text-green-400 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors flex items-center cursor-pointer"
                      aria-label={`View ${newCommentsCount} new comments`}
                      tabIndex={0}
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                      {newCommentsCount} new
                    </button>
                  )}
                </div>
                <div className="flex items-center">
                  {lastFetchTime && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-2 flex items-center">
                      <span>Last updated: {lastFetchTime}</span>
                      {countdown !== null && (
                        <span className="ml-2 flex items-center">
                          <span className="text-green-600 dark:text-green-400">
                            (marking as seen in {countdown}s)
                          </span>
                        </span>
                      )}
                    </span>
                  )}
                  <button
                    onClick={refreshComments}
                    className="p-1.5 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:rotate-180 duration-500"
                    aria-label="Refresh comments"
                    title="Refresh comments"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </h3>
              {posts[selectedPostIndex].comments.length > 0 ? (
                posts[selectedPostIndex].comments.map((comment) => (
                  <Comment
                    key={comment.id}
                    comment={comment}
                    depth={0}
                    timestamp={comment.created_utc}
                  />
                ))
              ) : (
                <p className="text-gray-600 dark:text-gray-400 italic text-center py-4">
                  No comments yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* New Comments Modal */}
        <NewCommentsModal
          isOpen={showNewCommentsModal}
          onClose={handleCloseNewCommentsModal}
          comments={posts[selectedPostIndex]?.comments || []}
          postTitle={posts[selectedPostIndex]?.title || ""}
        />
      </div>
    );
  };

  return (
    <div
      className={`flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 min-h-screen max-h-screen overflow-hidden`}
    >
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 shrink-0 shadow-sm">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {/* Subreddit title, sort options, and refresh in navbar for mobile */}
          <div className="flex items-center">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white ml-3 mr-2 flex items-center">
              <span className="text-orange-500 text-sm mr-1">r/</span>
              {subreddit}
            </h2>

            <button
              onClick={refreshPosts}
              className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:rotate-180 duration-500"
              aria-label="Refresh posts"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile sort toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
          <button
            onClick={() => updateSortPreference("hot")}
            className={`px-4 py-1 text-xs ${
              getCurrentSortPreference() === "hot"
                ? "bg-orange-500 text-white"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            Hot
          </button>
          <button
            onClick={() => updateSortPreference("new")}
            className={`px-4 py-1 text-xs ${
              getCurrentSortPreference() === "new"
                ? "bg-orange-500 text-white"
                : "text-gray-700 dark:text-gray-300"
            }`}
          >
            New
          </button>
        </div>
      </div>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div
        className={`
        ${sidebarOpen ? "block" : "hidden"} 
        md:block fixed md:static z-20 md:h-screen h-[calc(100vh-64px)] top-16 md:top-0 w-64
        transition-all duration-300 ease-in-out md:flex-shrink-0 shadow-lg md:shadow-none
      `}
      >
        <Sidebar
          subreddits={defaultSubreddits}
          selectedSubreddit={subreddit}
          onSubredditSelect={handleSubredditSelect}
        />
      </div>

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 z-10 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto relative"
        >
          {/* Intersection observer marker at the top */}
          <div ref={topMarkerRef} className="absolute top-0 h-1 w-full" />

          <MainContent />

          {/* Scroll to top button */}
          <button
            onClick={scrollToTop}
            className={`
              fixed bottom-4 right-7 z-50
              md:hidden
              ${
                showScrollTop
                  ? "opacity-70 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }
              bg-gray-800/70 hover:bg-gray-700 text-white
              rounded-full p-2 shadow-md backdrop-blur-sm
              transition-all duration-200
            `}
            aria-label="Scroll to top"
            title="Back to top"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
};

export default App;
