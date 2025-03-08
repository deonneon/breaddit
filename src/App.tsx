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
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user has a preference stored
    const savedPreference = localStorage.getItem("darkMode");
    // If no preference, use system preference
    if (savedPreference === null) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return savedPreference === "true";
  });

  // Default subreddits that are always available
  const defaultSubreddits = ["thewallstreet", "stocks", "singularity", "localllama", "wallstreetbets"];
  
  // Default post limits for each subreddit
  const subredditPostLimits: Record<string, number> = {
    "thewallstreet":3,
    "stocks": 4,
    "singularity": 8,
    "localllama": 8,
    "wallstreetbets": 8
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", String(newMode));
    document.documentElement.classList.toggle("dark", newMode);
  };

  // Set initial dark mode class on document
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

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

      // Get the post limit for the current subreddit or use default of 4
      const postLimit = subredditPostLimits[subreddit] || 4;
      const data = await fetchSubredditPosts(subreddit, postLimit);
      
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
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No posts found for r/{subreddit}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full p-4 md:p-8 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900">
        {/* Subreddit title and refresh button - visible only on desktop */}
        <div className="hidden md:flex items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <span className="text-orange-500 mr-2">r/</span>{subreddit}
          </h1>
          <button
            onClick={refreshPosts}
            className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:rotate-180 duration-500"
            aria-label="Refresh posts"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {posts.map((post, index) => (
            <button
              key={post.permalink}
              onClick={() => setSelectedPostIndex(index)}
              className={`px-3 md:px-4 py-2 h-auto min-h-16 rounded-lg text-sm w-full text-left overflow-hidden transition-all duration-200 shadow-sm hover:shadow ${
                selectedPostIndex === index
                  ? "bg-orange-500 text-white shadow-md transform scale-[1.02]"
                  : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              aria-label={`Select post "${post.title}"`}
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
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {posts[selectedPostIndex].title}
            </h2>
            
            <div className="flex items-center text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-4">
              <div className="flex items-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>u/{posts[selectedPostIndex].author}</span>
              </div>
              
              <div className="flex items-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>View on Reddit</span>
              </a>
            </div>

            {/* Display the submission body if it exists */}
            {posts[selectedPostIndex].selftext && (
              <div className="mt-2 mb-6 text-gray-800 dark:text-gray-200 break-words bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
                {renderMarkdown(posts[selectedPostIndex].selftext.trimStart())}
              </div>
            )}

            <div className="mt-6 md:mt-8 space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Comments
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
                <p className="text-gray-600 dark:text-gray-400 italic text-center py-4">No comments yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 min-h-screen max-h-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Mobile Header with Hamburger */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 shrink-0 shadow-sm">
        <div className="flex items-center">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <span className="text-orange-500 mr-1">B</span>readdit
          </h1>
        </div>
        
        {/* Subreddit title and refresh in navbar for mobile */}
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white mr-2 flex items-center">
            <span className="text-orange-500 text-sm mr-1">r/</span>{subreddit}
          </h2>
          <button
            onClick={refreshPosts}
            className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:rotate-180 duration-500"
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
        transition-all duration-300 ease-in-out md:flex-shrink-0 shadow-lg md:shadow-none
      `}>
        <Sidebar
          subreddits={defaultSubreddits}
          selectedSubreddit={subreddit}
          onSubredditSelect={handleSubredditSelect}
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
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
        <div className="flex-1 overflow-y-auto">
          <MainContent />
        </div>
      </main>
    </div>
  );
};

export default App;
