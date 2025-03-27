import { FC, useRef, useEffect } from "react";
import PostCard from "../posts/PostCard";
import PostDetail from "../posts/PostDetail";
import LoadingSpinner from "../ui/LoadingSpinner";
import ScrollToTop from "../ui/ScrollToTop";
import type { RedditPost, RedditComment } from "../../services/redditService";

interface MainContentProps {
  posts: RedditPost[];
  loading: boolean;
  error: string | null;
  subreddit: string;
  selectedPostIndex: number;
  setSelectedPostIndex: (index: number) => void;
  readPosts: Record<string, number>;
  markPostAsRead: (postId: string) => void;
  refreshPosts: () => void;
  seenComments: {
    [postPermalink: string]: {
      commentIds: string[];
      lastFetchTime: number;
    };
  };
  markAllCommentsAsSeen: (permalink: string, comments: RedditComment[]) => void;
  showScrollTop: boolean;
  setShowScrollTop: (show: boolean) => void;
}

const MainContent: FC<MainContentProps> = ({
  posts,
  loading,
  error,
  subreddit,
  selectedPostIndex,
  setSelectedPostIndex,
  readPosts,
  markPostAsRead,
  refreshPosts,
  seenComments,
  markAllCommentsAsSeen,
  showScrollTop,
  setShowScrollTop,
}) => {
  // Create a ref for the top marker (for intersection observer)
  const topMarkerRef = useRef<HTMLDivElement>(null);

  // Use IntersectionObserver to detect when we've scrolled past the top
  useEffect(() => {
    // Only set up on mobile and not on 2xl screens
    const isMobile = window.innerWidth < 768;
    const is2XL = window.innerWidth >= 1536;
    if (is2XL || !isMobile || !topMarkerRef.current) return;

    const options = {
      root: null, // Use the viewport as the root
      threshold: 0,
      rootMargin: "-100px 0px 0px 0px", // Consider it "out of view" when 100px down
    };

    const observer = new IntersectionObserver((entries) => {
      // When topMarker is not intersecting, we've scrolled down
      const [entry] = entries;
      setShowScrollTop(!entry.isIntersecting);
    }, options);

    observer.observe(topMarkerRef.current);

    return () => {
      if (topMarkerRef.current) {
        observer.unobserve(topMarkerRef.current);
      }
    };
  }, [setShowScrollTop]);

  // Function to scroll to top
  const scrollToTop = () => {
    // Scroll both window and document element for maximum compatibility
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Also scroll document element for Safari
    document.documentElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // And scroll body for older browsers
    document.body.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (loading) {
    return (
      <div className="w-full h-full min-h-[calc(100*var(--vh,1vh))] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100*var(--vh,1vh))] flex items-center justify-center">
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
      <div className="w-full h-[calc(100*var(--vh,1vh))] flex items-center justify-center">
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

  // For 2xl screens, we'll display a different layout with a traditional sidebar
  return (
    <div className="w-full h-full flex flex-col 2xl:flex-row bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* For 2xl screens: Fixed left sidebar with subreddit title and post listing */}
      <div className="hidden 2xl:flex 2xl:flex-col 2xl:w-80 2xl:h-[calc(100*var(--vh,1vh))] 2xl:flex-shrink-0 2xl:border-r 2xl:border-gray-200 2xl:dark:border-gray-700">
        {/* Subreddit title and refresh button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
              <span className="text-orange-500 mr-1">r/</span>
              {subreddit}
            </h1>
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
        </div>

        {/* Post listing in traditional sidebar style */}
        <div className="flex-1 overflow-y-auto px-2">
          {posts.map((post, index) => (
            <div
              key={post.permalink}
              className={`py-3 px-2 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                selectedPostIndex === index
                  ? "bg-orange-50 dark:bg-orange-900/20"
                  : ""
              }`}
            >
              <button
                onClick={() => {
                  setSelectedPostIndex(index);
                  markPostAsRead(post.permalink);
                }}
                className={`w-full text-left block ${
                  selectedPostIndex === index
                    ? "text-orange-600 dark:text-orange-400"
                    : "text-gray-800 dark:text-gray-200"
                }`}
                aria-label={`Select post "${post.title}${
                  post.isNewlyFetched && !readPosts[post.permalink]
                    ? " (New)"
                    : ""
                }`}
              >
                <div className="flex items-start">
                  {/* New post indicator */}
                  {post.isNewlyFetched && !readPosts[post.permalink] && (
                    <span
                      className="flex-shrink-0 h-2 w-2 mt-1.5 mr-2 bg-green-500 rounded-full"
                      aria-label="New post"
                    ></span>
                  )}
                  <div className="flex-1">
                    <h3
                      className={`text-sm font-medium mb-1 line-clamp-2 ${
                        selectedPostIndex === index
                          ? "text-orange-600 dark:text-orange-400"
                          : "text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      {post.title}
                    </h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span>by {post.author}</span>
                      <span className="mx-1">•</span>
                      <span>{post.comments?.length || 0} comments</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* For mobile and other screens: Regular post grid view */}
      <div className="w-full 2xl:hidden p-4 md:p-8 overflow-hidden">
        {/* Intersection observer marker at the top */}
        <div ref={topMarkerRef} className="absolute top-0 h-1 w-full" />

        {/* Subreddit title, sort options, and refresh button - visible only on desktop (not 2xl) */}
        <div className="hidden md:flex 2xl:hidden items-center mb-6 gap-2">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <span className="text-orange-500 mr-2">r/</span>
            {subreddit}
          </h1>

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

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-4 w-full max-w-full">
          {posts.map((post, index) => (
            <PostCard
              key={post.permalink}
              post={post}
              isSelected={selectedPostIndex === index}
              isNew={!!(post.isNewlyFetched && !readPosts[post.permalink])}
              onClick={() => {
                setSelectedPostIndex(index);
                markPostAsRead(post.permalink);
              }}
            />
          ))}
        </div>

        <div className="space-y-8 pb-16 w-full max-w-full">
          {selectedPostIndex < posts.length && (
            <PostDetail
              post={posts[selectedPostIndex]}
              seenComments={seenComments}
              markAllCommentsAsSeen={markAllCommentsAsSeen}
            />
          )}
        </div>

        {/* Scroll to top button */}
        <ScrollToTop show={showScrollTop} onClick={scrollToTop} />
      </div>

      {/* For 2xl screens: Right scrollable post detail content */}
      <div className="hidden 2xl:block 2xl:flex-1 2xl:h-[calc(100*var(--vh,1vh))] 2xl:overflow-y-auto 2xl:overflow-x-hidden 2xl:p-4">
        {selectedPostIndex < posts.length && (
          <PostDetail
            post={posts[selectedPostIndex]}
            seenComments={seenComments}
            markAllCommentsAsSeen={markAllCommentsAsSeen}
          />
        )}
      </div>
    </div>
  );
};

export default MainContent;
