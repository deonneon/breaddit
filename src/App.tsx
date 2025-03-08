// App.tsx
import { useState, useEffect, useCallback } from "react";
import { fetchSubredditPosts } from "./services/redditService";
import type { RedditPost } from "./services/redditService";
import Sidebar from "./components/Sidebar";
import Comment from "./components/Comment";
import LoadingSpinner from "./components/LoadingSpinner";

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


  // Add list of available subreddits
  const availableSubreddits = ["thewallstreet", "stocks"];

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
      setPosts(data);

      // Update cache
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
        }`
      );
    } finally {
      setLoading(false);
    }
  }, [subreddit, cachedPosts]);

  const handleSubredditSelect = (selectedSubreddit: string) => {
    setSubreddit(selectedSubreddit);
  };

  useEffect(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

  const MainContent = () => {
    return (
      <div className="w-full p-8 overflow-y-auto h-screen bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <>
            <div className="flex space-x-2 mb-4">
              {posts.map((post, index) => (
                <button
                  key={post.permalink}
                  onClick={() => setSelectedPostIndex(index)}
                  className={`px-4 py-2 rounded-lg text-xs ${
                    selectedPostIndex === index
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                  aria-label={`Select post "${post.title}"`}
                >
                  {post.title}
                </button>
              ))}
            </div>

            <>
              <div className="space-y-8">
                <div
                  key={posts[selectedPostIndex].permalink}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700"
                >
                  <div className="text-sm text-gray-700 dark:text-gray-400 mb-1">
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

                  <div className="mt-6 space-y-4">
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
            </>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="flex bg-gray-50 dark:bg-gray-900">
      <Sidebar
        subreddits={availableSubreddits}
        selectedSubreddit={subreddit}
        onSubredditSelect={handleSubredditSelect}
      />
      <main className="flex-1 overflow-hidden">
        <MainContent />
      </main>
    </div>
  );
};

export default App;
