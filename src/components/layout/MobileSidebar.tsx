import { FC } from "react";
import type { RedditPost } from "../../services/redditService";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  posts: RedditPost[];
  selectedPostIndex: number;
  setSelectedPostIndex: (index: number) => void;
  markPostAsRead: (postId: string) => void;
  readPosts: Record<string, number>;
  refreshPosts: () => void;
  subreddit: string;
  scrollPostDetailToTop: () => void;
}

const MobileSidebar: FC<MobileSidebarProps> = ({
  isOpen,
  onClose,
  posts,
  selectedPostIndex,
  setSelectedPostIndex,
  markPostAsRead,
  readPosts,
  refreshPosts,
  subreddit,
  scrollPostDetailToTop,
}) => {
  const handleSelectPost = (index: number) => {
    setSelectedPostIndex(index);
    markPostAsRead(posts[index].permalink);
    scrollPostDetailToTop();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-72 max-w-[80vw] bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800 dark:text-white flex items-center">
            <span className="text-orange-500 mr-1">r/</span>
            {subreddit}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshPosts}
              className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
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
            <button
              onClick={onClose}
              className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              aria-label="Close sidebar"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Post list */}
        <div className="flex-1 overflow-y-auto">
          {posts.map((post, index) => (
            <div
              key={post.permalink}
              className={`py-3 px-4 border-b border-gray-100 dark:border-gray-800 last:border-0 ${
                selectedPostIndex === index
                  ? "bg-orange-50 dark:bg-orange-900/20"
                  : ""
              }`}
            >
              <button
                onClick={() => handleSelectPost(index)}
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
    </>
  );
};

export default MobileSidebar; 