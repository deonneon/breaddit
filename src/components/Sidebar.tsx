import React from "react";

interface SidebarProps {
  subreddits: string[];
  selectedSubreddit: string;
  onSubredditSelect: (subreddit: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  subreddits,
  selectedSubreddit,
  onSubredditSelect,
}) => {
  return (
    <aside className="w-64 shrink-0 bg-gray-800 p-4 h-screen sticky top-0">
      <h2 className="text-xl font-bold text-white mb-4">Subreddits</h2>
      <ul className="space-y-2">
        {subreddits.map((subreddit) => (
          <li key={subreddit}>
            <button
              className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                selectedSubreddit === subreddit
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
              onClick={() => onSubredditSelect(subreddit)}
              aria-label={`Select ${subreddit} subreddit`}
            >
              {subreddit}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
