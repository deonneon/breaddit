import { useEffect, useState } from "react";
import Modal from "./Modal";
import Comment from "../posts/Comment";
import type { RedditComment } from "../../services/redditService";
import { renderMarkdown } from "../../utils/markdownUtils";

type NewCommentsModalProps = {
  isOpen: boolean;
  onClose: (markAsSeen?: boolean) => void;
  comments: RedditComment[];
  postTitle: string;
};

interface CommentThread {
  threadComments: RedditComment[];
  newCommentIndex: number; // Index of the new comment in the thread
}

const NewCommentsModal = ({
  isOpen,
  onClose,
  comments,
  postTitle,
}: NewCommentsModalProps) => {
  // Store found threads to prevent losing them when comments are marked as seen
  const [cachedThreads, setCachedThreads] = useState<CommentThread[]>([]);

  // Function to find all comment threads that contain new comments
  const findNewCommentThreads = (
    comments: RedditComment[]
  ): CommentThread[] => {
    const threads: CommentThread[] = [];

    // Function to find a path from root to new comment
    const findThreadsWithNewComments = (
      comment: RedditComment,
      currentPath: RedditComment[] = []
    ) => {
      const updatedPath = [...currentPath, comment];

      // Check if current comment is new
      if (comment.isNew) {
        threads.push({
          threadComments: updatedPath,
          newCommentIndex: updatedPath.length - 1,
        });
      }

      // Check replies
      if (comment.replies && comment.replies.length > 0) {
        // Check each reply for new comments
        for (const reply of comment.replies) {
          findThreadsWithNewComments(reply, updatedPath);
        }
      }
    };

    // Start searching from top-level comments
    for (const comment of comments) {
      findThreadsWithNewComments(comment);
    }

    return threads;
  };

  // Helper to get the indentation class based on depth
  const getIndentClass = (depth: number): string => {
    if (depth === 0) return "";
    if (depth === 1) return "ml-4";
    if (depth === 2) return "ml-8";
    if (depth === 3) return "ml-12";
    if (depth === 4) return "ml-16";
    return "ml-20"; // Max indentation
  };

  // When modal opens, cache the threads and post title
  useEffect(() => {
    if (isOpen) {
      const threads = findNewCommentThreads(comments);
      setCachedThreads(threads);
    }
  }, [isOpen, comments, postTitle]);

  const displayThreads =
    cachedThreads.length > 0 ? cachedThreads : findNewCommentThreads(comments);

  // If there are no threads and the modal is open, close it gracefully
  useEffect(() => {
    if (isOpen && displayThreads.length === 0 && comments.length > 0) {
      // Only close if we've actually loaded comments
      onClose();
    }
  }, [isOpen, displayThreads.length, comments.length, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New Comments (${displayThreads.length})`}
    >
      {displayThreads.length > 0 ? (
        <div className="space-y-8">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <button
              onClick={() => onClose(true)}
              className="text-xs px-3 py-1 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-800/40 text-orange-700 dark:text-orange-400 rounded-full transition-colors"
              aria-label="Close and mark all comments as seen"
            >
              Mark all seen
            </button>
          </div>

          {displayThreads.map((thread, threadIndex) => (
            <div
              key={`thread-${threadIndex}-${
                thread.threadComments[thread.newCommentIndex].id
              }`}
              className="border-b border-gray-100 dark:border-gray-700 pb-1 last:border-0"
            >
              {/* Render each comment in the thread */}
              <div className="relative space-y-3">
                {thread.threadComments.map((comment, commentIndex) => {
                  const isNewComment = commentIndex === thread.newCommentIndex;
                  const depth = commentIndex; // Depth increases with each level

                  return (
                    <div
                      key={comment.id}
                      className={`relative z-10 ${
                        isNewComment ? "animate-highlight rounded-md py-1" : ""
                      }`}
                    >
                      {/* For comments before the new one, render a simpler version */}
                      {!isNewComment ? (
                        <div
                          className={`${getIndentClass(
                            depth
                          )} pl-4 border-l-2 border-gray-300 dark:border-gray-600 pb-1`}
                        >
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-between font-medium">
                              {comment.author}
                          </div>
                          <div className="comment-body text-gray-700 dark:text-gray-300 break-words prose dark:prose-invert max-w-none">
                            {renderMarkdown(comment.body)}
                          </div>
                        </div>
                      ) : (
                        // For the new comment, use the full Comment component
                        <div className={`${getIndentClass(depth)} relative`}>
                          {/* New comment indicator */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-full"></div>
                          <Comment
                            comment={comment}
                            depth={0} // Reset depth to 0 for proper Comment component styling
                            timestamp={comment.created_utc}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No new comments found.</p>
        </div>
      )}
    </Modal>
  );
};

export default NewCommentsModal;
