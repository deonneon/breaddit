import { FC, useState, useCallback, useEffect } from 'react';
import type { RedditPost, RedditComment } from '../../services/redditService';
import Comment from '../Comment';
import { formatDate } from '../../utils/formatters';
import { renderMarkdown } from '../../utils/markdownUtils';
import NewCommentsModal from '../NewCommentsModal';

interface PostDetailProps {
  post: RedditPost;
  refreshComments: () => void;
  seenComments: {
    [postPermalink: string]: {
      commentIds: string[];
      lastFetchTime: number;
    };
  };
  markAllCommentsAsSeen: (permalink: string, comments: RedditComment[]) => void;
}

const PostDetail: FC<PostDetailProps> = ({ 
  post, 
  refreshComments, 
  seenComments,
  markAllCommentsAsSeen
}) => {
  // Add a countdown timer for when new comments will be marked as seen
  const [countdown, setCountdown] = useState<number | null>(null);
  // Add state for new comments modal
  const [showNewCommentsModal, setShowNewCommentsModal] = useState(false);

  // Function to manually mark all comments as seen immediately
  const handleMarkAllSeen = () => {
    markAllCommentsAsSeen(post.permalink, post.comments);
    // Reset the countdown
    setCountdown(null);
  };

  // Get the count of new comments for the post
  const countNewComments = useCallback(() => {
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

    countNew(post.comments);
    return count;
  }, [post.comments]);

  // Format the last fetch time
  const getLastFetchTime = useCallback(() => {
    if (!post.permalink || !seenComments[post.permalink]) return null;

    const lastFetchTime = new Date(seenComments[post.permalink].lastFetchTime);
    return lastFetchTime.toLocaleTimeString();
  }, [post.permalink, seenComments]);

  // Calculate values
  const newCommentsCount = countNewComments();
  const lastFetchTime = getLastFetchTime();

  // Start countdown when we have new comments
  useEffect(() => {
    if (newCommentsCount > 0) {
      // Only start the countdown for posts we've seen before - not for first loads
      const isFirstTimeSeenPost = !(
        post.permalink && seenComments[post.permalink]?.commentIds?.length > 0
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
    post.permalink,
    seenComments,
    showNewCommentsModal,
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
        const isFirstTimeSeenPost = !(
          post.permalink && seenComments[post.permalink]?.commentIds?.length > 0
        );

        if (!isFirstTimeSeenPost) {
          setCountdown(30);
        }
      }
    }
  };

  return (
    <div 
      key={post.permalink}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300"
    >
      <h5 className="text-md md:text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center">
        {post.title}
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
            {post.author === "AutoModerator" ? "AutoMod" : post.author}
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
          <span>{formatDate(post.created_utc)}</span>
        </div>

        <a
          href={`https://reddit.com${post.permalink}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 transition-colors"
          aria-label={`View post "${post.title}" on Reddit`}
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
      {post.selftext && (
        <div className="post-content mt-2 mb-2 text-gray-800 dark:text-gray-200 break-words bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700">
          {renderMarkdown(post.selftext.trimStart())}
        </div>
      )}

      {/* Display post image if it exists */}
      {!post.is_self && (
        <div className="mt-2 mb-2">
          {post.is_video ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
              <a
                href={post.url}
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
                  post.url_overridden_by_dest ||
                  post.url
                }
                alt={post.title}
                className="max-w-full h-auto rounded-md"
                loading="lazy"
                onError={(e) => {
                  // If image fails to load, show a link instead
                  const target = e.target as HTMLImageElement;
                  const container = target.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <a 
                        href="${post.url}" 
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
        {post.comments.length > 0 ? (
          post.comments.map((comment) => (
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

      {/* New Comments Modal */}
      <NewCommentsModal
        isOpen={showNewCommentsModal}
        onClose={handleCloseNewCommentsModal}
        comments={post.comments || []}
        postTitle={post.title || ""}
      />
    </div>
  );
};

export default PostDetail; 