import { RedditComment } from "../services/redditService";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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

// Function to render markdown with custom components
const renderMarkdown = (text: string) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, href, children, ...props }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline break-all text-xs md:text-base"
            {...props}
          >
            {children}
          </a>
        ),
        p: ({ children }) => <p className="mb-2 text-xs md:text-base">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1 text-xs md:text-base">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-300 pl-2 italic text-gray-700 dark:text-gray-400 mb-2">
            {children}
          </blockquote>
        ),
        // Simplified code component to avoid type issues
        code: (props) => {
          const { children, className } = props;
          // Check if this is an inline code block
          const match = /language-(\w+)/.exec(className || '');
          const isInline = !match;
          
          return isInline ? (
            <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded text-xs md:text-sm">
              {children}
            </code>
          ) : (
            <pre className="bg-gray-200 dark:bg-gray-800 p-2 rounded overflow-x-auto mb-2">
              <code className={`text-xs md:text-sm ${className}`}>
                {children}
              </code>
            </pre>
          );
        },
      }}
    >
      {text}
    </ReactMarkdown>
  );
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
        <div className="text-gray-900 dark:text-gray-200 mb-2 ml-2 md:ml-4 break-words overflow-hidden max-w-full">
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
