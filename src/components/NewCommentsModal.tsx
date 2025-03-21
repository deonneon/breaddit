import { useEffect, useState } from "react";
import Modal from "./Modal";
import Comment from "./Comment";
import type { RedditComment } from "../services/redditService";
import { renderMarkdown } from "../utils/markdownUtils";

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
  const [postTitleSnapshot, setPostTitleSnapshot] = useState<string>("");

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
      setPostTitleSnapshot(postTitle);
    }
  }, [isOpen, comments, postTitle]);

  const displayThreads =
    cachedThreads.length > 0 ? cachedThreads : findNewCommentThreads(comments);
  const displayTitle = postTitleSnapshot || postTitle;

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
            <span>
              Showing new comments from{" "}
              <span className="font-semibold">{displayTitle}</span>
            </span>
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
              className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0"
            >
              {/* Comment thread heading */}
              <div className="mb-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                Thread {threadIndex + 1}:
              </div>

              {/* Render each comment in the thread */}
              <div className="relative space-y-3">
                {/* Thread line connector */}
                <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 z-0"></div>

                {thread.threadComments.map((comment, commentIndex) => {
                  const isNewComment = commentIndex === thread.newCommentIndex;
                  const depth = commentIndex; // Depth increases with each level
                  const isLastComment =
                    commentIndex === thread.threadComments.length - 1;

                  return (
                    <div
                      key={comment.id}
                      className={`relative z-10 ${
                        isNewComment ? "animate-highlight rounded-md py-1" : ""
                      }`}
                    >
                      {/* Comment connector dot */}
                      {!isLastComment && (
                        <div className="absolute left-[7px] top-6 w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 z-10"></div>
                      )}
                      {isLastComment && (
                        <div className="absolute left-[7px] top-6 w-4 h-4 rounded-full bg-green-100 dark:bg-green-900 border-2 border-green-500 z-10"></div>
                      )}

                      {/* For comments before the new one, render a simpler version */}
                      {!isNewComment ? (
                        <div
                          className={`${getIndentClass(
                            depth
                          )} pl-4 border-l-2 border-gray-300 dark:border-gray-600 pb-2`}
                        >
                          <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center justify-between">
                            <span className="font-medium">
                              {comment.author}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                              parent
                            </span>
                          </div>
                          <div className="text-gray-700 dark:text-gray-300 text-sm break-words prose dark:prose-invert prose-sm max-w-none">
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

              {/* Thread timeline navigation */}
              {thread.threadComments.length > 2 && (
                <div className="mt-4 flex items-center justify-start overflow-x-auto py-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mr-2">
                    Thread:
                  </div>
                  <div className="flex space-x-1">
                    {thread.threadComments.map((_, idx) => (
                      <div
                        key={idx}
                        className={`
                          h-1.5 w-6 rounded-full
                          ${
                            idx === thread.newCommentIndex
                              ? "bg-green-500 dark:bg-green-500"
                              : "bg-gray-300 dark:bg-gray-600"
                          }
                        `}
                        title={
                          idx === thread.newCommentIndex
                            ? "New comment"
                            : "Parent comment"
                        }
                      />
                    ))}
                  </div>
                </div>
              )}
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
