import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react";
import type { RedditPost, RedditComment } from "../../services/redditService";
import Comment from "./Comment";
import { formatDate } from "../../utils/formatters";
import { renderMarkdown } from "../../utils/markdownUtils";
import NewCommentsModal from "../modals/NewCommentsModal";

interface PostDetailProps {
  post: RedditPost;
  seenComments: {
    [postPermalink: string]: {
      commentIds: string[];
      lastFetchTime: number;
    };
  };
  markAllCommentsAsSeen: (permalink: string, comments: RedditComment[]) => void;
}

export interface PostDetailHandle {
  markAllCommentsSeen: () => void;
  getNewCommentsCount: () => number;
}

const PostDetail = forwardRef<PostDetailHandle, PostDetailProps>(({
  post,
  seenComments,
  markAllCommentsAsSeen,
}, ref) => {
  // Add state for new comments modal
  const [showNewCommentsModal, setShowNewCommentsModal] = useState(false);
  // Add local state to track if comments were manually marked as seen
  const [localMarkSeen, setLocalMarkSeen] = useState(false);
  // Add state to store the processed comments
  const [processedComments, setProcessedComments] = useState<RedditComment[]>(
    []
  );

  // Process comments recursively to handle 'isNew' flags
  const processCommentsWithNewFlags = useCallback(
    (comments: RedditComment[], markAsSeen: boolean): RedditComment[] => {
      return comments.map((comment) => {
        const processedReplies: RedditComment[] = comment.replies
          ? processCommentsWithNewFlags(comment.replies, markAsSeen)
          : [];

        return {
          ...comment,
          isNew: markAsSeen ? false : comment.isNew,
          replies: processedReplies,
        };
      });
    },
    []
  );

  // Function to manually mark all comments as seen immediately
  const handleMarkAllSeen = useCallback(() => {
    // Use commentsToRender which includes all processed comments
    const commentsToMark =
      processedComments.length > 0 ? processedComments : post.comments;

    // First process the comments
    const updatedComments = processCommentsWithNewFlags(commentsToMark, true);
 
    // Update both states together
    setProcessedComments(updatedComments);
    setLocalMarkSeen(true);

    // Finally update localStorage
    markAllCommentsAsSeen(post.permalink, updatedComments);
    
    // Force an update of the new comments count in parent component
    // by triggering a re-render
    setProcessedComments([...updatedComments]);
  }, [
    post.permalink,
    post.comments,
    processedComments,
    markAllCommentsAsSeen,
    processCommentsWithNewFlags,
  ]);

  // Function to get the current new comments count
  const getNewCommentsCount = useCallback(() => {
    if (localMarkSeen) return 0;
    
    // Count new comments recursively through the comment tree
    const countNewComments = (comments: RedditComment[]): number => {
      if (!comments || !comments.length) return 0;
      
      return comments.reduce((count, comment) => {
        // Count this comment if it's new
        let newCount = comment.isNew ? 1 : 0;
        
        // Count new comments in replies
        if (comment.replies && comment.replies.length > 0) {
          newCount += countNewComments(comment.replies);
        }
        
        return count + newCount;
      }, 0);
    };
    
    return countNewComments(processedComments);
  }, [localMarkSeen, processedComments]);

  // Expose the markAllCommentsSeen method to parent components
  useImperativeHandle(ref, () => ({
    markAllCommentsSeen: handleMarkAllSeen,
    getNewCommentsCount
  }), [handleMarkAllSeen, getNewCommentsCount]);

  // Check if this is the first time seeing this post/thread
  const isFirstTimeSeenPost = !seenComments[post.permalink];

  // Get the count of new comments for the post, respecting local marked state
  const newCommentsCount = getNewCommentsCount();
  
  // Reset ALL state when post changes
  useEffect(() => {
    // Reset state for a new post
    setProcessedComments([]);
    setLocalMarkSeen(false);
    setShowNewCommentsModal(false);
    
    // Process comments immediately
    if (post.comments?.length > 0) {
      const updatedComments = processCommentsWithNewFlags(
        post.comments,
        false // Always start with seen state from props
      );
      setProcessedComments(updatedComments);
    }
  }, [post.permalink, processCommentsWithNewFlags, post.comments]);

  // Effect that runs when component is mounted or post changes
  // This ensures we have the latest seen state from seenComments
  useEffect(() => {
    // We need to check if this post's comments have been seen before
    // using the latest seenComments props
    const isCurrentlySeen = seenComments[post.permalink];
    
    // Update localMarkSeen state based on whether comments are already seen
    if (isCurrentlySeen) {
      // If we've seen this post before, check if we should mark all comments as seen
      const allCommentsSeen = post.comments?.every(comment => {
        // Check if this comment ID is in the seen list
        return seenComments[post.permalink]?.commentIds?.includes(comment.id);
      });
      
      // Update the local state
      if (allCommentsSeen) {
        setLocalMarkSeen(true);
        
        // Process comments to remove isNew flags visually
        if (post.comments?.length > 0) {
          const processedWithNoNewFlags = processCommentsWithNewFlags(
            post.comments,
            true // Mark all comments as seen
          );
          setProcessedComments(processedWithNoNewFlags);
        }
      } else {
        // There are some new comments - need to process them correctly
        if (post.comments?.length > 0) {
          // Process comments using the latest seenComments data
          const updatedComments = post.comments.map(comment => {
            const isCommentNew = !seenComments[post.permalink]?.commentIds?.includes(comment.id);
            
            // Process replies recursively
            const processReplies = (replies: RedditComment[] | undefined): RedditComment[] => {
              if (!replies || !replies.length) return [];
              
              return replies.map(reply => {
                const isReplyNew = !seenComments[post.permalink]?.commentIds?.includes(reply.id);
                
                return {
                  ...reply,
                  isNew: isReplyNew,
                  replies: processReplies(reply.replies)
                };
              });
            };
            
            return {
              ...comment,
              isNew: isCommentNew,
              replies: processReplies(comment.replies)
            };
          });
          
          setProcessedComments(updatedComments);
        }
      }
    }
  }, [post.permalink, post.comments, seenComments, processCommentsWithNewFlags]);

  useEffect(() => {
    if (isFirstTimeSeenPost && post.comments?.length > 0) {
      handleMarkAllSeen();
    }
  }, [isFirstTimeSeenPost, post.comments, handleMarkAllSeen]);

  // Reset localMarkSeen only when post.permalink changes
  useEffect(() => {
    setLocalMarkSeen(false);
  }, [post.permalink]);

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
    }
  };

  // Use the processed comments instead of post.comments
  const commentsToRender =
    processedComments.length > 0 ? processedComments : post.comments;

  return (
    <div
      key={post.permalink}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden max-w-full"
    >
      <h5 className="text-md md:text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center break-words">
        {post.title}
      </h5>

      <div className="flex flex-wrap items-center text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2">
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
        <div className="text-xs mt-1 mb-1 text-gray-800 dark:text-gray-200 break-words bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700 prose dark:prose-invert max-w-full overflow-hidden">
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
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-center overflow-hidden max-w-full">
              <img
                src={post.url_overridden_by_dest || post.url}
                alt={post.title}
                className="max-w-full h-auto rounded-md object-contain"
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
            {newCommentsCount > 0 && !localMarkSeen && (
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
          {newCommentsCount > 0 && !localMarkSeen && (
            <button
              onClick={handleMarkAllSeen}
              className="text-xs px-3 py-1 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-800/40 active:bg-orange-300 dark:active:bg-orange-700/50 text-orange-700 dark:text-orange-400 rounded-full transition-colors flex items-center"
              aria-label="Mark all comments as seen"
              tabIndex={0}
            >
              Mark all seen
            </button>
          )}
        </h3>
        {commentsToRender.length > 0 ? (
          commentsToRender.map((comment) => (
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
        comments={commentsToRender}
        postTitle={post.title || ""}
      />
    </div>
  );
});

export default PostDetail;
