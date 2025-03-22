import { FC } from 'react';
import type { SortType } from '../../services/redditService';

interface MobileHeaderProps {
  subreddit: string;
  refreshPosts: () => void;
  toggleSidebar: () => void;
  currentSort: SortType;
  updateSort: (sort: SortType) => void;
}

const MobileHeader: FC<MobileHeaderProps> = ({
  subreddit,
  refreshPosts,
  toggleSidebar,
  currentSort,
  updateSort,
}) => {
  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 shrink-0 shadow-sm">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Open sidebar"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        {/* Subreddit title and refresh in navbar for mobile */}
        <div className="flex items-center">
          <h2 className="text-lg font-medium text-gray-800 dark:text-white ml-3 mr-2 flex items-center">
            <span className="text-orange-500 text-sm mr-1">r/</span>
            {subreddit}
          </h2>

          <button
            onClick={refreshPosts}
            className="p-2 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform hover:rotate-180 duration-500"
            aria-label="Refresh posts"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile sort toggle */}
      <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
        <button
          onClick={() => updateSort('hot')}
          className={`px-4 py-1 text-xs ${
            currentSort === 'hot'
              ? 'bg-orange-500 text-white'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          aria-label="Sort by hot"
        >
          Hot
        </button>
        <button
          onClick={() => updateSort('new')}
          className={`px-4 py-1 text-xs ${
            currentSort === 'new'
              ? 'bg-orange-500 text-white'
              : 'text-gray-700 dark:text-gray-300'
          }`}
          aria-label="Sort by new"
        >
          New
        </button>
      </div>
    </div>
  );
};

export default MobileHeader; 