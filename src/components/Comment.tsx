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
  
  const borderClass = depth > 0 ? "border-l-1 border-gray-300 dark:border-gray-700 border-dotted" : "";

  return (
    <div className="mb-3 md:mb-4">
      <div className={`pl-2 md:pl-4 ${getIndentClass()} ${borderClass}`}>
        <div className="text-xs md:text-sm text-gray-700 dark:text-gray-400 mb-1 flex items-center">
          {depth === 0 && <span className="inline-block w-2 h-1 bg-gray-500 dark:bg-gray-400 mr-2"></span>}
          <span className="font-normal">{comment.author}</span><span className="font-light ml-2 text-xs">{formatDate(timestamp)}</span>
        </div>
        <div className={`text-gray-900 dark:text-gray-200 mb-2 break-words overflow-hidden max-w-full ${depth === 0 ? "ml-2 md:ml-4" : ""} `}>
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
