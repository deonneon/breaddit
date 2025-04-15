import { useState, useEffect } from "react";
import SettingsModal from "../modals/SettingsModal";
import ThemeToggle from "../ui/ThemeToggle";
import type { SortType } from "../../services/redditService";
import type { FontSize } from "../../hooks/useUISettings";

interface SidebarProps {
  subreddits: string[];
  selectedSubreddit: string;
  onSubredditSelect: (subreddit: string) => void;
  sortPreferences: Record<string, SortType>;
  updateSortPreference: (subreddit: string, sortType: SortType) => void;
  updateGlobalSortPreference: (sortType: SortType) => void;
  fontSize: FontSize;
  updateFontSize: (size: FontSize) => void;
  validateSubreddit?: (subreddit: string) => Promise<boolean>;
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
  validateSubreddit,
}: SidebarProps) => {
  const [inputSubreddit, setInputSubreddit] = useState("");
  const [mySubreddits, setMySubreddits] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved subreddits from localStorage on component mount
  useEffect(() => {
    const savedSubreddits = localStorage.getItem("mySubreddits");
    if (savedSubreddits) {
      setMySubreddits(JSON.parse(savedSubreddits));
    }
  }, []);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

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
    // Clear error immediately when input changes
    if (error) setError(null);
  };

  const handleFetchClick = async () => {
    if (!inputSubreddit.trim()) return;
    
    const newSubreddit = inputSubreddit.trim();
    setIsLoading(true);
    setError(null);
    
    try {
      // If validateSubreddit function is provided, use it to check if subreddit exists
      if (validateSubreddit) {
        const exists = await validateSubreddit(newSubreddit);
        if (!exists) {
          setError(`Subreddit r/${newSubreddit} doesn't exist`);
          setIsLoading(false);
          return; // Early return to prevent navigation
        }
      }
      
      // Only proceed with navigation and adding to mySubreddits if validation passes
      onSubredditSelect(newSubreddit);

      // Add to mySubreddits if not already in the list
      if (
        !mySubreddits.includes(newSubreddit) &&
        !subreddits.includes(newSubreddit)
      ) {
        setMySubreddits((prev) => [...prev, newSubreddit]);
      }

      setInputSubreddit("");
    } catch (err) {
      setError(`Error fetching subreddit: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
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
    <aside className="w-full h-full px-6 sm:px-0 bg-white dark:bg-gray-800 text-gray-800 dark:text-white overflow-hidden flex flex-col border-r border-gray-200 dark:border-gray-700">
      <div className="hidden sm:block p-4 border-b border-gray-200 dark:border-gray-700 items-center justify-between">
        <h1 className="text-xl font-bold flex items-center">
          <span className="text-orange-500 mr-1">B</span>readdit
        </h1>
      </div>

      <div className="p-3 mt-20 md:mt-3">
        <div className="relative mb-6">
          <input
            type="text"
            value={inputSubreddit}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="w-full px-4 py-2 text-xl md:text-sm pr-10 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:focus:ring-orange-400 dark:focus:border-orange-400 transition-colors text-base"
            placeholder="Enter subreddit"
            aria-label="Subreddit name"
          />
          <button
            onClick={handleFetchClick}
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Fetch posts"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
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
            )}
          </button>
        </div>
        
        {error && (
          <div 
            className="mb-4 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md flex items-center animate-pulse border border-red-300 dark:border-red-700 shadow-sm"
            role="alert"
            aria-live="assertive"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="font-medium flex-grow">{error}</span>
            <button 
              onClick={() => setError(null)} 
              className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-6">
          <h2 className="text-3xl md:text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7 md:h-4 md:w-4 mr-2"
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
            Default
          </h2>
          <div className="space-y-2">
            {subreddits.map((subreddit) => (
              <button
                key={subreddit}
                onClick={() => onSubredditSelect(subreddit)}
                className={`w-full px-4 py-2 rounded-lg text-left transition-all duration-200 ${
                  selectedSubreddit === subreddit
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
                aria-label={`Select ${subreddit} subreddit`}
                aria-pressed={selectedSubreddit === subreddit}
              >
                <div className="flex items-center">
                  <span className="text-3xl md:text-sm font-medium">
                    r/{subreddit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {mySubreddits.length > 0 && (
          <div className="mb-6">
            <h2 className="text-3xl md:text-sm uppercase font-semibold text-gray-500 dark:text-gray-400 mb-3 px-1 flex items-center">
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
                      : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  aria-label={`Select ${subreddit} subreddit`}
                  aria-pressed={selectedSubreddit === subreddit}
                >
                  <div className="flex items-center">
                    <span className="text-3xl md:text-sm font-medium">
                      r/{subreddit.toLowerCase()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-2 px-4 border-t border-gray-200 dark:border-gray-700 absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center justify-between">

          <ThemeToggle />
          <button
            onClick={openSettings}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Open settings"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 md:h-5 md:w-5"
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
