import { RedditComment } from "../../services/redditService";
import { renderMarkdown } from "../../utils/markdownUtils";
import { formatDate } from "../../utils/formatters";

type CommentProps = {
  comment: RedditComment;
  depth: number;
  timestamp: number;
};

const Comment = ({ comment, depth, timestamp }: CommentProps) => {
  // Adjust indentation for mobile
  const getIndentClass = () => {
    if (depth === 0) return "";
    // Reduce indentation on mobile
    return `ml-${Math.min(depth * 3, 6)} md:ml-${Math.min(depth * 4, 16)}`;
  };

  // Different border colors for different nesting levels
  const getBorderColor = () => {
    if (depth === 0) return "";

    const colors = [
      "border-orange-300 dark:border-orange-700",
      "border-orange-200 dark:border-orange-800",
      "border-orange-100 dark:border-orange-900",
      "border-orange-300 dark:border-orange-700",
      "border-orange-200 dark:border-orange-800",
    ];

    return colors[(depth - 1) % colors.length];
  };

  // Add a special border for new comments
  const getCommentClass = () => {
    if (comment.isNew) {
      return "border-l-2 border-green-500 dark:border-green-400 bg-green-50/80 dark:bg-green-900/20 shadow-sm";
    }

    return depth > 0 ? `border-l-1 ${getBorderColor()} border-dotted` : "";
  };

  const commentClass = getCommentClass();

  return (
    <div className="mb-2 md:mb-3 group">
      <div
        className={`${getIndentClass()} ${commentClass} transition-all duration-200 ${
          comment.isNew ? "pl-3 md:pl-4" : "pl-2 md:pl-4"
        }`}
      >
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
          {depth === 0 ? (
            <span className="inline-block w-2 h-1 bg-gray-300 rounded-half mr-2 flex-shrink-0"></span>
          ) : (
            ""
          )}
          <span className="font-medium">{comment.author}</span>
          <span className="font-light ml-2 text-xs opacity-80">
            {formatDate(timestamp)}
          </span>
          {comment.isNew && (
            <span className="ml-2 text-xs font-medium text-green-600 dark:text-green-400 px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
              new
            </span>
          )}
        </div>
        <div
          className={`comment-body text-gray-900 dark:text-gray-200 mb-2 break-words overflow-hidden max-w-full prose dark:prose-invert prose-orange ${
            depth === 0 ? "ml-4" : ""
          }`}
        >
          {renderMarkdown(comment.body)}
        </div>
        {/* Render nested replies if they exist */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-1 md:mt-2">
            {comment.replies.map((reply) => (
              <Comment
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                timestamp={reply.created_utc}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Comment;
