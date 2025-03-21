import { useState, useEffect } from "react";
import SettingsModal from "./SettingsModal";
import type { SortType } from "../services/redditService";

interface SidebarProps {
  subreddits: string[];
  selectedSubreddit: string;
  onSubredditSelect: (subreddit: string) => void;
  sortPreferences: Record<string, SortType>;
  updateSortPreference: (subreddit: string, sortType: SortType) => void;
  updateGlobalSortPreference: (sortType: SortType) => void;
  fontSize: string;
  updateFontSize: (size: string) => void;
}

const Sidebar = ({
  subreddits,
  selectedSubreddit,
  onSubredditSelect,
  sortPreferences,
  updateSortPreference,
  updateGlobalSortPreference,
  fontSize,
  updateFontSize,
}: SidebarProps) => {
  const [inputSubreddit, setInputSubreddit] = useState("");
  const [mySubreddits, setMySubreddits] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load saved subreddits from localStorage on component mount
  useEffect(() => {
    const savedSubreddits = localStorage.getItem("mySubreddits");
    if (savedSubreddits) {
      setMySubreddits(JSON.parse(savedSubreddits));
    }
  }, []);

  // Save mySubreddits to localStorage whenever it changes
  useEffect(() => {
    if (mySubreddits.length > 0) {
      localStorage.setItem("mySubreddits", JSON.stringify(mySubreddits));
    } else {
      // If all custom subreddits are deleted, remove the entry from localStorage
      localStorage.removeItem("mySubreddits");
    }
  }, [mySubreddits]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputSubreddit(e.target.value);
  };

  const handleFetchClick = () => {
    if (inputSubreddit.trim()) {
      const newSubreddit = inputSubreddit.trim();
      onSubredditSelect(newSubreddit);

      // Add to mySubreddits if not already in the list
      if (
        !mySubreddits.includes(newSubreddit) &&
        !subreddits.includes(newSubreddit)
      ) {
        setMySubreddits((prev) => [...prev, newSubreddit]);
      }

      setInputSubreddit("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleFetchClick();
    }
  };

  const handleDeleteSubreddit = (subredditToDelete: string) => {
    setMySubreddits((prev) => prev.filter((s) => s !== subredditToDelete));
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  return (
    <aside className="w-full h-full bg-white dark:bg-gray-800 text-gray-800 dark:text-white overflow-y-auto flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="hidden sm:block p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center">
          <span className="text-orange-500 mr-1">B</span>readdit
        </h1>
        {/* <button 
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button> */}
      </div>

      <div className="p-4">
        <div className="relative mb-6">
          <input
            type="text"
            value={inputSubreddit}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 pr-10 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 transition-colors"
            placeholder="Enter subreddit name"
            aria-label="Subreddit name"
          />
          <button
            onClick={handleFetchClick}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300"
            aria-label="Fetch posts"
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-6">
          <h2 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
            Default Subreddits
          </h2>
          <div className="space-y-2">
            {subreddits.map((subreddit) => (
              <button
                key={subreddit}
                onClick={() => onSubredditSelect(subreddit)}
                className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 ${
                  selectedSubreddit === subreddit
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                }`}
                aria-label={`Select ${subreddit} subreddit`}
                aria-pressed={selectedSubreddit === subreddit}
              >
                <div className="flex items-center">
                  <span className="text-sm font-medium">r/{subreddit}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {mySubreddits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              My Subreddits
            </h2>
            <div className="space-y-2">
              {mySubreddits.map((subreddit) => (
                <button
                  key={subreddit}
                  onClick={() => onSubredditSelect(subreddit)}
                  className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 ${
                    selectedSubreddit === subreddit
                      ? "bg-orange-500 text-white shadow-sm"
                      : "bg-white text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  }`}
                  aria-label={`Select ${subreddit} subreddit`}
                  aria-pressed={selectedSubreddit === subreddit}
                >
                  <div className="flex items-center">
                    <span className="text-sm font-medium">r/{subreddit}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>Breaddit - Reddit Reader</p>
            <p className="mt-1">Made with ❤️</p>
          </div>
          <button
            onClick={openSettings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open settings"
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
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        mySubreddits={mySubreddits}
        onDeleteSubreddit={handleDeleteSubreddit}
        sortPreferences={sortPreferences}
        updateGlobalSortPreference={updateGlobalSortPreference}
        updateSubredditSortPreference={updateSortPreference}
        fontSize={fontSize}
        updateFontSize={updateFontSize}
      />
    </aside>
  );
};

export default Sidebar;
