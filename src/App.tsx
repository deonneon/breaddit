// App.tsx
import Sidebar from "./components/layout/Sidebar";
import MainContent from "./components/layout/MainContent";
import MobileHeader from "./components/layout/MobileHeader";
import { useSubredditPosts } from "./hooks/useSubredditPosts";
import { useComments } from "./hooks/useComments";
import { useUISettings, FontSize } from "./hooks/useUISettings";

// Default subreddits that are always available
const DEFAULT_SUBREDDITS = [
  "thewallstreet",
  "stocks",
  "singularity",
  "localllama",
  "wallstreetbets",
];

const App = () => {
  // Get UI settings from hook
  const {
    fontSize,
    updateFontSize,
    sidebarOpen,
    setSidebarOpen,
    toggleSidebar,
    showScrollTop,
    setShowScrollTop,
  } = useUISettings();

  // Get comments functionality from hook
  const {
    seenComments,
    markAllCommentsAsSeen,
  } = useComments();

  // Get subreddit posts functionality from hook
  const {
    posts,
    loading,
    error,
    subreddit,
    setSubreddit,
    selectedPostIndex,
    setSelectedPostIndex,
    markPostAsRead,
    readPosts,
    getCurrentSortPreference,
    updateSortPreference,
    updateGlobalSortPreference,
    updateCurrentSortPreference,
    sortPreferences,
    refreshPosts
  } = useSubredditPosts("thewallstreet");

  const handleSubredditSelect = (selectedSubreddit: string) => {
    setSubreddit(selectedSubreddit);
    // Close sidebar on mobile after selecting a subreddit
    setSidebarOpen(false);
  };

  return (
    <div
      className={`flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 min-h-screen max-h-screen overflow-hidden overflow-x-hidden relative`}
    >
      {/* Mobile Header with Hamburger and Sidebar */}
      <MobileHeader
        subreddit={subreddit}
        refreshPosts={refreshPosts}
        toggleSidebar={toggleSidebar}
        currentSort={getCurrentSortPreference()}
        updateSort={updateCurrentSortPreference}
        sortPreferences={sortPreferences}
        updateSortPreference={updateSortPreference}
        updateGlobalSortPreference={updateGlobalSortPreference}
        fontSize={fontSize as FontSize}
        updateFontSize={updateFontSize as (size: FontSize) => void}
        subreddits={DEFAULT_SUBREDDITS}
        onSubredditSelect={handleSubredditSelect}
        sidebarOpen={sidebarOpen}
      />

      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block md:h-screen w-64 md:flex-shrink-0">
        <Sidebar
          subreddits={DEFAULT_SUBREDDITS}
          selectedSubreddit={subreddit}
          onSubredditSelect={handleSubredditSelect}
          sortPreferences={sortPreferences}
          updateSortPreference={updateSortPreference}
          updateGlobalSortPreference={updateGlobalSortPreference}
          fontSize={fontSize as FontSize}
          updateFontSize={updateFontSize as (size: FontSize) => void}
        />
      </div>

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 z-10 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main className="flex-1 overflow-hidden overflow-x-hidden flex flex-col">
        <MainContent
          posts={posts}
          loading={loading}
          error={error}
          subreddit={subreddit}
          selectedPostIndex={selectedPostIndex}
          setSelectedPostIndex={setSelectedPostIndex}
          readPosts={readPosts}
          markPostAsRead={markPostAsRead}
          refreshPosts={refreshPosts}
          seenComments={seenComments}
          markAllCommentsAsSeen={markAllCommentsAsSeen}
          showScrollTop={showScrollTop}
          setShowScrollTop={setShowScrollTop}
        />
      </main>
    </div>
  );
};

export default App;
