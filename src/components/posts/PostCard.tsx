import { FC } from 'react';
import type { RedditPost } from '../../services/redditService';

interface PostCardProps {
  post: RedditPost;
  isSelected: boolean;
  isNew: boolean;
  onClick: () => void;
}

const PostCard: FC<PostCardProps> = ({ post, isSelected, isNew, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 md:px-4 py-2 h-auto min-h-16 rounded-lg text-sm w-full text-left overflow-hidden transition-all duration-200 shadow-sm hover:shadow ${
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
      <div className="line-clamp-3">{post.title}</div>
    </button>
  );
};

export default PostCard; 