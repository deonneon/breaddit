import { RedditComment } from "../services/redditService";

type CommentProps = {
  comment: RedditComment;
  depth: number;
  timestamp: number;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Function to format comment text with proper line breaks and URL handling
const formatCommentText = (text: string) => {
  // Split the text by new lines
  const paragraphs = text.split("\n").filter(p => p.trim() !== "");
  
  // URL regex pattern
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  return paragraphs.map((paragraph, index) => {
    // Check if the paragraph contains only a URL
    const urlMatches = paragraph.match(urlRegex);
    const isOnlyUrl = urlMatches && urlMatches.length === 1 && urlMatches[0] === paragraph.trim();
    
    if (isOnlyUrl) {
      // For paragraphs that are just a URL, render as a clickable link
      return (
        <p key={index} className="mb-2">
          <a 
            href={urlMatches[0]} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline break-all text-xs md:text-base"
          >
            {urlMatches[0]}
          </a>
        </p>
      );
    } else {
      // For mixed content paragraphs, replace URLs with clickable links
      const parts = paragraph.split(urlRegex);
      const elements = [];
      
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 0) {
          // Text part
          if (parts[i]) {
            elements.push(parts[i]);
          }
        } else {
          // URL part
          elements.push(
            <a 
              key={`link-${i}`} 
              href={parts[i]} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:underline break-all text-xs md:text-base"
            >
              {parts[i]}
            </a>
          );
        }
      }
      
      return <p key={index} className="mb-2 text-xs md:text-base">{elements}</p>;
    }
  });
};

const Comment = ({ comment, depth, timestamp }: CommentProps) => {
  // Adjust indentation for mobile
  const getIndentClass = () => {
    if (depth === 0) return "";
    // Reduce indentation on mobile
    return `ml-${Math.min(depth * 2, 6)} md:ml-${Math.min(depth * 4, 16)}`;
  };
  
  const borderClass = depth > 0 ? "border-l-2 border-gray-300 dark:border-gray-700" : "";

  return (
    <div className="mb-3 md:mb-4">
      <div className={`pl-2 md:pl-4 ${getIndentClass()} ${borderClass}`}>
        <div className="text-xs md:text-sm text-gray-700 dark:text-gray-400 mb-1 flex items-center">
          {depth === 0 && <span className="inline-block w-2 h-1 bg-gray-500 dark:bg-gray-400 mr-2"></span>}
          u/{comment.author} - {formatDate(timestamp)}
        </div>
        <div className="text-gray-900 dark:text-gray-200 mb-2 ml-2 md:ml-4 break-words overflow-hidden max-w-full text-xs md:text-base">
          {formatCommentText(comment.body)}
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
