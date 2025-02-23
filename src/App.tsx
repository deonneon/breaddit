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

  const handleFetchPostsClick = (inputSubreddit: string) => {
    setSubreddit(inputSubreddit);
    handleFetchPosts();
  };

  useEffect(() => {
    handleFetchPosts();
  }, [handleFetchPosts]);

  const MainContent = () => {
    return (
      <div className="w-full p-8 ">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <>
            <div className="flex space-x-2 mb-4">
              <div className="flex space-x-2 mb-4">
                {posts.map((post, index) => (
                  <button
                    key={post.permalink}
                    onClick={() => setSelectedPostIndex(index)}
                    className={`px-4 py-2 rounded-lg ${
                      selectedPostIndex === index
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-black"
                    }`}
                    aria-label={`Select post "${post.title}"`}
                  >
                    {post.title}
                  </button>
                ))}
              </div>
              <SubredditInput onFetch={handleFetchPostsClick} />
            </div>

            <>
              <div className="space-y-8">
                <div
                  key={posts[selectedPostIndex].permalink}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="text-sm text-gray-600 mb-1">
                    Posted by u/{posts[selectedPostIndex].author} on{" "}
                    {formatDate(posts[selectedPostIndex].created_utc)}{" "}
                    <a
                      href={`https://reddit.com${posts[selectedPostIndex].permalink}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline inline-block"
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
                      <p className="text-gray-500">No comments yet</p>
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
    <div className="flex">
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

const SubredditInput = ({
  onFetch,
}: {
  onFetch: (subreddit: string) => void;
}) => {
  const [inputSubreddit, setInputSubreddit] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSubreddit(e.target.value);
  };

  const handleFetchClick = () => {
    onFetch(inputSubreddit);
  };

  return (
    <div className="mb-6">
      <input
        type="text"
        value={inputSubreddit}
        onChange={handleInputChange}
        className="px-4 py-2 border rounded-lg mr-2"
        placeholder="Enter subreddit name"
        aria-label="Subreddit name"
      />
      <button
        onClick={handleFetchClick}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
        aria-label="Fetch posts"
      >
        Fetch Posts
      </button>
    </div>
  );
};
