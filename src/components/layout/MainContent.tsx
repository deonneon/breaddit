import { FC, useRef, useEffect } from 'react';
import PostCard from '../posts/PostCard';
import PostDetail from '../posts/PostDetail';
import LoadingSpinner from '../ui/LoadingSpinner';
import ScrollToTop from '../ui/ScrollToTop';
import type { RedditPost } from '../../services/redditService';

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
  refreshComments: () => void;
  seenComments: any;
  markAllCommentsAsSeen: any;
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
  refreshComments,
  seenComments,
  markAllCommentsAsSeen,
  showScrollTop,
  setShowScrollTop,
}) => {
  // Create a ref for the scrollable content container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Create a ref for an element at the top of the page (for intersection observer)
  const topMarkerRef = useRef<HTMLDivElement>(null);

  // Update CSS variable for viewport height to handle mobile browsers
  useEffect(() => {
    const updateHeight = () => {
      // Set a CSS variable with the viewport height
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    // Initial update
    updateHeight();

    // Update on resize and orientation change
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

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
  }, [setShowScrollTop]);

  // Function to scroll to top
  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
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
    <div 
      ref={scrollContainerRef}
      className="w-full p-4 md:p-8 overflow-y-auto h-full bg-gray-50 dark:bg-gray-900 mobile-height"
    >
      {/* Intersection observer marker at the top */}
      <div ref={topMarkerRef} className="absolute top-0 h-1 w-full" />

      {/* Subreddit title, sort options, and refresh button - visible only on desktop */}
      <div className="hidden md:flex items-center mb-6 gap-2">
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

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
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

      <div className="space-y-8 pb-16 max-w-4xl mx-auto">
        {selectedPostIndex < posts.length && (
          <PostDetail
            post={posts[selectedPostIndex]}
            refreshComments={refreshComments}
            seenComments={seenComments}
            markAllCommentsAsSeen={markAllCommentsAsSeen}
          />
        )}
      </div>

      {/* Scroll to top button */}
      <ScrollToTop show={showScrollTop} onClick={scrollToTop} />
    </div>
  );
};

export default MainContent; 