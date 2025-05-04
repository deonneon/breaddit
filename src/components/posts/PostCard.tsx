import { FC } from 'react';
import type { RedditPost } from '../../services/redditService';

interface PostCardProps {
  post: RedditPost;
  isSelected: boolean;
  isNew: boolean;
  onClick: () => void;
}

const PostCard: FC<PostCardProps> = ({ post, isSelected, isNew, onClick }) => {
  const newCommentsCount = post._newCommentsCount || 0;


  return (
    <button
      onClick={onClick}
      className={`relative px-3 md:px-4 py-2 w-[44vw] h-[80px] md:h-auto md:min-h-16 rounded-lg text-xs sm:text-sm text-left overflow-hidden transition-all duration-200 shadow-sm hover:shadow flex-shrink-0 md:max-w-none md:w-full ${
        isSelected
          ? `bg-orange-500 text-white shadow-md transform scale-[1.02] ${
              isNew ? "border-l-2 border-green-300" : ""
            }`
          : isNew
          ? "bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border-l-2 border-green-500"
          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      aria-label={`Select post "${post.title}${isNew ? " (New)" : ""}`}
      title={post.title}
    >
      <div className="line-clamp-2 md:line-clamp-3">{post.title}</div>

      {/* New comments badge */}
      {isNew && newCommentsCount > 0 && (
        <div className="absolute top-1 right-1 min-w-[20px] h-5 flex items-center justify-center px-1 text-xs font-semibold rounded-full bg-green-500 text-white">
          {newCommentsCount}
        </div>
      )}        
    </button>
  );
};

export default PostCard; 