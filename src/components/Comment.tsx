import { RedditComment } from "../services/redditService";
import { renderMarkdown } from "../utils/markdownUtils";

type CommentProps = {
  comment: RedditComment;
  depth: number;
  timestamp: number;
};

const formatDate = (timestamp: number): string => {
  const commentDate = new Date(timestamp * 1000);
  const today = new Date();
  
  // Check if the comment was posted today
  const isToday = 
    commentDate.getDate() === today.getDate() &&
    commentDate.getMonth() === today.getMonth() &&
    commentDate.getFullYear() === today.getFullYear();
  
  if (isToday) {
    // For comments posted today, only show hours and minutes
    return commentDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    // For older comments, show the full date
    return commentDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
};

const Comment = ({ comment, depth, timestamp }: CommentProps) => {
  // Adjust indentation for mobile
  const getIndentClass = () => {
    if (depth === 0) return "";
    // Reduce indentation on mobile
    return `ml-${Math.min(depth * 2, 6)} md:ml-${Math.min(depth * 4, 16)}`;
  };
  
  // Different border colors for different nesting levels
  const getBorderColor = () => {
    if (depth === 0) return "";
    
    const colors = [
      "border-orange-300 dark:border-orange-700",
      "border-blue-300 dark:border-blue-700",
      "border-green-300 dark:border-green-700",
      "border-purple-300 dark:border-purple-700",
      "border-pink-300 dark:border-pink-700",
    ];
    
    return colors[(depth - 1) % colors.length];
  };
  
  const borderClass = depth > 0 
    ? `border-l-2 ${getBorderColor()} pl-2 md:pl-4` 
    : "";

  return (
    <div className="mb-4 md:mb-5 group">
      <div className={`${getIndentClass()} ${borderClass} transition-all duration-200`}>
        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center">
          {depth === 0 ? (
            <span className="inline-block w-2 h-2 bg-orange-500 rounded-half mr-2 flex-shrink-0"></span>
          ) : ""}
          <span className="font-medium">{comment.author}</span>
          <span className="font-light ml-2 text-xs opacity-80">{formatDate(timestamp)}</span>
        </div>
        <div className={`text-gray-900 dark:text-gray-200 mb-3 break-words overflow-hidden max-w-full prose dark:prose-invert prose-sm md:prose-base prose-orange ${depth === 0 ? "ml-6" : "ml-4"}`}>
          {renderMarkdown(comment.body)}
        </div>
        {/* Render nested replies if they exist */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 md:mt-3">
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
