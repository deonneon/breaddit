import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Function to filter out Reddit emotes
export const filterRedditEmotes = (text: string): string => {
  // This regex matches the pattern ![img](emote|t5_2th52|4260) and similar formats
  return text.replace(/!\[img\]\(emote\|[^)]+\)/g, '');
};

// Function to render markdown with custom components
export const renderMarkdown = (text: string) => {
  // Filter out Reddit emotes before rendering
  const filteredText = filterRedditEmotes(text);
  
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ node, href, children, ...props }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-blue-600 hover:underline break-all text-xs"
            {...props}
          >
            {children}
          </a>
        ),
        p: ({ children }) => <p className="mb-1 text-xs md:text-sm">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-2">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc ml-5 mb-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-5 mb-2">{children}</ol>,
        li: ({ children }) => <li className="mb-1 text-xs md:text-sm">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-gray-400 pl-4 italic text-gray-700 dark:text-gray-400 mb-2">
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
            <code className="bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-blue-400 px-1 rounded text-xs md:text-sm">
              {children}
            </code>
          ) : (
            <pre className="bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-blue-400 p-2 rounded overflow-x-auto mb-2">
              <code className={`text-xs md:text-sm ${className}`}>
                {children}
              </code>
            </pre>
          );
        },
        // Add support for images
        img: ({ src, alt }) => (
          <img 
            src={src} 
            alt={alt || 'Post image'} 
            className="max-w-full h-auto rounded-md my-2"
            loading="lazy"
          />
        )
      }}
    >
      {filteredText}
    </ReactMarkdown>
  );
}; 