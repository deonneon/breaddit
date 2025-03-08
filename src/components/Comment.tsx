import { RedditComment } from "../services/redditService";

type CommentProps = {
  comment: RedditComment;
  depth: number;
  timestamp: number;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Comment = ({ comment, depth, timestamp }: CommentProps) => {
  const indentClass = depth > 0 ? `ml-${Math.min(depth * 4, 16)}` : "";
  const borderClass = depth > 0 ? "border-l-2 border-gray-300 dark:border-gray-700" : "";

  return (
    <div className="mb-4">
      <div className={`pl-4 ${indentClass} ${borderClass}`}>
        <div className="text-sm text-gray-700 dark:text-gray-400 mb-1">
          u/{comment.author} - {formatDate(timestamp)}
        </div>
        <div className="text-gray-900 dark:text-gray-200 mb-2">{comment.body}</div>
        {/* Render nested replies if they exist */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
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
