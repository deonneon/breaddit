// App.tsx
import Sidebar from "./components/layout/Sidebar";
import MainContent from "./components/layout/MainContent";
import MobileHeader from "./components/layout/MobileHeader";
import { useSubredditPosts } from "./hooks/useSubredditPosts";
import { useComments } from "./hooks/useComments";
import { useUISettings, FontSize } from "./hooks/useUISettings";
import { validateSubreddit } from "./services/redditService";
import { useEffect } from "react";

// Default subreddits that are always available
const DEFAULT_SUBREDDITS = [
  "thewallstreet",
  "stocks",
  "singularity",
  "localllama",
  "wallstreetbets",
];

const App = () => {
  // Get initial subreddit from URL if available
  const getInitialSubreddit = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subredditParam = params.get('subreddit');
      return subredditParam && DEFAULT_SUBREDDITS.includes(subredditParam) 
        ? subredditParam 
        : "thewallstreet";
    }
    return "thewallstreet";
  };
  
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
  const { seenComments, markAllCommentsAsSeen, refreshSeenCommentsFromStorage } = useComments();

  // Get subreddit posts functionality from hook with initial subreddit from URL
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
    refreshPosts,
  } = useSubredditPosts(getInitialSubreddit());

  const handleSubredditSelect = (selectedSubreddit: string) => {
    setSubreddit(selectedSubreddit);
    // Close sidebar on mobile after selecting a subreddit
    setSidebarOpen(false);
  };

  // Set CSS variables for viewport height to handle mobile browsers
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Set the height initially
    setViewportHeight();

    // Update the height on resize
    window.addEventListener("resize", setViewportHeight);

    return () => {
      window.removeEventListener("resize", setViewportHeight);
    };
  }, []);

  return (
    <div
      className={`flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 min-h-[calc(100*var(--vh,1vh))] w-full max-w-full overflow-hidden`}
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
      <div className="hidden md:block md:fixed md:left-0 md:top-0 md:h-[calc(100*var(--vh,1vh))] w-48 md:z-20">
        <Sidebar
          subreddits={DEFAULT_SUBREDDITS}
          selectedSubreddit={subreddit}
          onSubredditSelect={handleSubredditSelect}
          sortPreferences={sortPreferences}
          updateSortPreference={updateSortPreference}
          updateGlobalSortPreference={updateGlobalSortPreference}
          fontSize={fontSize as FontSize}
          updateFontSize={updateFontSize as (size: FontSize) => void}
          validateSubreddit={validateSubreddit}
        />
      </div>

      {/* Overlay to close sidebar when clicking outside on mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 z-[15] bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main
        className={`
          flex-1 max-w-full overflow-hidden 
          min-h-[calc(100*var(--vh,1vh))] md:min-h-[calc(100*var(--vh,1vh))] md:ml-48
          ${sidebarOpen ? "pt-0" : "pt-16"} md:pt-0
          transition-spacing duration-300
        `}
      >
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
          refreshSeenCommentsFromStorage={refreshSeenCommentsFromStorage}
        />
      </main>
    </div>
  );
};

export default App;
