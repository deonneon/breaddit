import { useState, useEffect } from "react";
import Modal from "./Modal";
import type { SortType } from "../services/redditService";
import { renderMarkdown } from "../utils/markdownUtils";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mySubreddits: string[];
  onDeleteSubreddit: (subreddit: string) => void;
  sortPreferences: Record<string, SortType>;
  updateGlobalSortPreference: (sortType: SortType) => void;
  updateSubredditSortPreference: (
    subreddit: string,
    sortType: SortType
  ) => void;
  fontSize: string;
  updateFontSize: (size: string) => void;
};

const SettingsModal = ({
  isOpen,
  onClose,
  mySubreddits,
  onDeleteSubreddit,
  sortPreferences,
  updateGlobalSortPreference,
  updateSubredditSortPreference,
  fontSize,
  updateFontSize,
}: SettingsModalProps) => {
  const [defaultSort, setDefaultSort] = useState<SortType>("hot");
  const [selectedFontSize, setSelectedFontSize] = useState(fontSize);
  const [pageZoom, setPageZoom] = useState("100");

  // Update defaultSort state when modal opens
  useEffect(() => {
    setDefaultSort(sortPreferences["default"] || "hot");
  }, [isOpen, sortPreferences]);

  // Update selectedFontSize when the prop changes
  useEffect(() => {
    setSelectedFontSize(fontSize);
  }, [fontSize]);

  // Load saved zoom level or set to default 100%
  useEffect(() => {
    const savedZoom = localStorage.getItem("pageZoom");
    if (savedZoom) {
      setPageZoom(savedZoom);
      applyZoom(savedZoom);
    }
  }, []);

  // Handle changing global default sort
  const handleGlobalSortChange = (sort: SortType) => {
    setDefaultSort(sort);
    updateGlobalSortPreference(sort);
  };

  // Handle changing subreddit-specific sort preference
  const handleSubredditSortChange = (subreddit: string, sort: SortType) => {
    updateSubredditSortPreference(subreddit, sort);
  };

  // Handle font size change
  const handleFontSizeChange = (size: string) => {
    setSelectedFontSize(size);
    updateFontSize(size);
  };

  // Handle page zoom change
  const handleZoomChange = (zoomLevel: string) => {
    setPageZoom(zoomLevel);
    localStorage.setItem("pageZoom", zoomLevel);
    applyZoom(zoomLevel);
  };

  // Apply zoom to the document
  const applyZoom = (zoomLevel: string) => {
    // Get the zoom value as a number (remove % if present)
    const zoomValue = parseInt(zoomLevel.replace("%", "")) / 100;

    // Use the more reliable CSS zoom property with fallbacks
    document.documentElement.style.setProperty(
      "--page-zoom",
      zoomValue.toString()
    );

    // Apply zoom directly to html element (most browsers support this)
    document.documentElement.style.zoom = zoomValue.toString();

    // For Firefox which doesn't support zoom property
    if (navigator.userAgent.indexOf("Firefox") !== -1) {
      document.body.style.transform = `scale(${zoomValue})`;
      document.body.style.transformOrigin = "top left";
      document.body.style.width = `${100 / zoomValue}%`;
    }

    // Update meta viewport for mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute(
        "content",
        `width=device-width, initial-scale=${zoomValue}`
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div className="space-y-8">
        {/* Font Size Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Text Size
          </h3>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden w-fit">
            <button
              onClick={() => handleFontSizeChange("small")}
              className={`px-4 py-2 text-sm ${
                selectedFontSize === "small"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set text size to small"
            >
              Small
            </button>
            <button
              onClick={() => handleFontSizeChange("medium")}
              className={`px-4 py-2 text-sm ${
                selectedFontSize === "medium"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set text size to medium"
            >
              Medium
            </button>
            <button
              onClick={() => handleFontSizeChange("large")}
              className={`px-4 py-2 text-sm ${
                selectedFontSize === "large"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set text size to large"
            >
              Large
            </button>
          </div>

          {/* Font size preview */}
          <div className="mt-4 border rounded-lg border-gray-200 dark:border-gray-700 p-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview:
            </h4>
            <div className="space-y-4">
              {/* Comment preview */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Comment example:
                </p>
                <div className="p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">username123</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </span>
                  </div>
                  <div
                    className={`comment-body prose dark:prose-invert prose-sm break-words`}
                    style={{
                      fontSize:
                        selectedFontSize === "small"
                          ? "0.875rem"
                          : selectedFontSize === "medium"
                          ? "1rem"
                          : "1.125rem",
                    }}
                  >
                    {renderMarkdown(
                      "This is how **comments** will appear with " +
                        selectedFontSize +
                        " text size. *Adjust the size* to make reading more comfortable."
                    )}
                  </div>
                </div>
              </div>

              {/* Post content preview */}
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Post content example:
                </p>
                <div className="p-3 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div
                    className={`post-content prose dark:prose-invert prose-sm break-words`}
                    style={{
                      fontSize:
                        selectedFontSize === "small"
                          ? "0.9375rem"
                          : selectedFontSize === "medium"
                          ? "1.0625rem"
                          : "1.1875rem",
                    }}
                  >
                    {renderMarkdown(
                      "## Post Content Preview\n\nThis is how **post content** will appear with " +
                        selectedFontSize +
                        " text size.\n\n- List items\n- Will also scale\n- Based on your preference"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Adjust the size of text in comments and posts.
          </p>
        </div>

        {/* Page Zoom Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Page Zoom
          </h3>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden w-fit">
            <button
              onClick={() => handleZoomChange("90")}
              className={`px-3 py-2 text-sm ${
                pageZoom === "90"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set page zoom to 90%"
            >
              90%
            </button>
            <button
              onClick={() => handleZoomChange("100")}
              className={`px-3 py-2 text-sm ${
                pageZoom === "100"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set page zoom to 100%"
            >
              100%
            </button>
            <button
              onClick={() => handleZoomChange("110")}
              className={`px-3 py-2 text-sm ${
                pageZoom === "110"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set page zoom to 110%"
            >
              110%
            </button>
            <button
              onClick={() => handleZoomChange("125")}
              className={`px-3 py-2 text-sm ${
                pageZoom === "125"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set page zoom to 125%"
            >
              125%
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Adjust the overall page zoom level. Current zoom: {pageZoom}%
          </p>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Default Sort Preference
          </h3>
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden w-fit">
            <button
              onClick={() => handleGlobalSortChange("hot")}
              className={`px-4 py-2 text-sm ${
                defaultSort === "hot"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set default sort to hot"
            >
              Hot
            </button>
            <button
              onClick={() => handleGlobalSortChange("new")}
              className={`px-4 py-2 text-sm ${
                defaultSort === "new"
                  ? "bg-orange-500 text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              aria-label="Set default sort to new"
            >
              New
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This setting applies to all subreddits without a specific
            preference.
          </p>
        </div>

        {mySubreddits.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              My Subreddits
            </h3>
            <div className="space-y-3">
              {mySubreddits.map((subreddit) => (
                <div
                  key={subreddit}
                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    r/{subreddit}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                      <button
                        onClick={() =>
                          handleSubredditSortChange(subreddit, "hot")
                        }
                        className={`px-3 py-1 text-xs ${
                          sortPreferences[subreddit] === "hot"
                            ? "bg-orange-500 text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                        aria-label={`Set ${subreddit} sort to hot`}
                      >
                        Hot
                      </button>
                      <button
                        onClick={() =>
                          handleSubredditSortChange(subreddit, "new")
                        }
                        className={`px-3 py-1 text-xs ${
                          sortPreferences[subreddit] === "new"
                            ? "bg-orange-500 text-white"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                        aria-label={`Set ${subreddit} sort to new`}
                      >
                        New
                      </button>
                    </div>
                    <button
                      onClick={() => onDeleteSubreddit(subreddit)}
                      className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
                      aria-label={`Delete ${subreddit}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mySubreddits.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No custom subreddits added yet.</p>
            <p className="mt-1 text-sm">
              Search for subreddits to add them to your list.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SettingsModal;
