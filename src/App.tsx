// App.tsx
import { useState, useEffect, useCallback } from "react";
import { fetchSubredditPosts } from "./services/redditService";
import type { RedditPost } from "./services/redditService";
import Sidebar from "./components/Sidebar";
import Comment from "./components/Comment";
import LoadingSpinner from "./components/LoadingSpinner";
import { renderMarkdown } from "./utils/markdownUtils";

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
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

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const App = () => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState("thewallstreet");
  const [cachedPosts, setCachedPosts] = useState<CachedPosts>({});
  const [selectedPostIndex, setSelectedPostIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Default subreddits that are always available
  const defaultSubreddits = ["thewallstreet", "stocks", "singularity"];

  const handleFetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const cachedData = cachedPosts[subreddit];
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Using cached data for subreddit: ${subreddit}`);
        setPosts(cachedData.posts);
        setLoading(false);
        return;
      }

      const data = await fetchSubredditPosts(subreddit);
      
      // Ensure we're only using the latest data from the server
      setPosts(data);
      setSelectedPostIndex(0); // Reset selected post when changing subreddit

      // Update cache with only the latest data from the server
      setCachedPosts((prev) => ({
        ...prev,
        [subreddit]: {
          posts: data,
          timestamp: now,
        },
      }));
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
  }, [subreddit, cachedPosts]);

  // Force refresh posts for the current subreddit
  const refreshPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchSubredditPosts(subreddit);
      setPosts(data);
      
      // Update cache with fresh data
      setCachedPosts((prev) => ({
        ...prev,
        [subreddit]: {
          posts: data,
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
  }, [subreddit]);

  const handleSubredditSelect = (selectedSubreddit: string) => {
    setSubreddit(selectedSubreddit);
    // Close sidebar on mobile after selecting a subreddit
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  useEffect(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

  const MainContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-red-600">{error}</div>
        </div>
      );
    }
    
    if (posts.length === 0) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">No posts found for r/{subreddit}</div>
        </div>
      );
    }

    return (
      <div className="w-full p-4 md:p-8 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
        {/* Subreddit title and refresh button - visible only on desktop */}
        <div className="hidden md:flex items-center mb-4 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">r/{subreddit}</h1>
          <button
            onClick={refreshPosts}
            className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-blue-600 transition-transform hover:rotate-180 duration-500"
            aria-label="Refresh posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 mb-4">
          {posts.map((post, index) => (
            <button
              key={post.permalink}
              onClick={() => setSelectedPostIndex(index)}
              className={`px-3 md:px-4 py-1 h-16 md:py-2 rounded-lg text-xs w-full text-left overflow-hidden ${
                selectedPostIndex === index
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
              aria-label={`Select post "${post.title}"`}
              title={post.title}
            >
              {post.title}
            </button>
          ))}
        </div>

        <div className="space-y-8 pb-16">
          <div
            key={posts[selectedPostIndex].permalink}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700"
          >
            <div className="text-xs md:text-sm text-gray-700 dark:text-gray-400 mb-1">
              Posted by u/{posts[selectedPostIndex].author} on{" "}
              {formatDate(posts[selectedPostIndex].created_utc)}{" "}
              <a
                href={`https://reddit.com${posts[selectedPostIndex].permalink}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline inline-block"
                aria-label={`View post "${posts[selectedPostIndex].title}" on Reddit`}
              >
                View on Reddit
              </a>
            </div>

            {/* Display the submission body if it exists */}
            {posts[selectedPostIndex].selftext && (
              <div className="mt-2 mb-2 text-gray-800 dark:text-gray-200 break-words">
                {renderMarkdown(posts[selectedPostIndex].selftext.trimStart())}
              </div>
            )}

            <div className="mt-2 md:mt-3 space-y-3">
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
                <p className="text-gray-600 dark:text-gray-400">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 min-h-screen max-h-screen overflow-hidden">
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 shrink-0">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-gray-800 dark:text-white">Breaddit</h1>
        </div>
        
        {/* Subreddit title and refresh in navbar for mobile */}
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mr-2">r/{subreddit}</h2>
          <button
            onClick={refreshPosts}
            className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-transform hover:rotate-180 duration-500"
            aria-label="Refresh posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div className={`
        ${sidebarOpen ? 'block' : 'hidden'} 
        md:block fixed md:static z-20 md:h-screen h-[calc(100vh-64px)] top-16 md:top-0 w-64
        transition-all duration-300 ease-in-out md:flex-shrink-0
      `}>
        <Sidebar
          subreddits={defaultSubreddits}
          selectedSubreddit={subreddit}
          onSubredditSelect={handleSubredditSelect}
        />
      </div>

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {sidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 top-16 z-10 bg-gray-100 dark:bg-gray-800 opacity-70"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto">
          <MainContent />
        </div>
      </main>
    </div>
  );
};

export default App;
