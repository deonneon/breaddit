import { useState } from "react";

interface SidebarProps {
  subreddits: string[];
  selectedSubreddit: string;
  onSubredditSelect: (subreddit: string) => void;
}

const Sidebar = ({
  subreddits,
  selectedSubreddit,
  onSubredditSelect,
}: SidebarProps) => {
  const [inputSubreddit, setInputSubreddit] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSubreddit(e.target.value);
  };

  const handleFetchClick = () => {
    if (inputSubreddit.trim()) {
      onSubredditSelect(inputSubreddit.trim());
      setInputSubreddit("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetchClick();
    }
  };

  return (
    <aside className="w-64 bg-gray-800 p-4">
      <div className="mb-6">
        <input
          type="text"
          value={inputSubreddit}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-2 border rounded-lg mb-2"
          placeholder="Enter subreddit name"
          aria-label="Subreddit name"
        />
        <button
          onClick={handleFetchClick}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
          aria-label="Fetch posts"
        >
          Fetch Posts
        </button>
      </div>

      <h2 className="text-lg font-semibold mb-4">Your Subreddits</h2>
      <div className="space-y-2">
        {subreddits.map((subreddit) => (
          <button
            key={subreddit}
            onClick={() => onSubredditSelect(subreddit)}
            className={`w-full px-4 py-2 rounded-lg text-left transition-colors ${
              selectedSubreddit === subreddit
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-800 hover:bg-gray-200"
            }`}
            aria-label={`Select ${subreddit} subreddit`}
            aria-pressed={selectedSubreddit === subreddit}
          >
            r/{subreddit}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
