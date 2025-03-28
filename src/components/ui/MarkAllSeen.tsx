import { FC } from "react";

interface MarkAllSeenProps {
  onClick: () => void;
}

const MarkAllSeen: FC<MarkAllSeenProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-32 left-2 z-10 md:bottom-20 md:right-8">
      <button
        onClick={onClick}
        className="opacity-90 hover:bg-orange-600/90 text-gray-300 rounded-lg p-2 shadow-xl backdrop-blur-md transition-all duration-200 border border-white/20 relative before:absolute before:inset-[-12px] before:content-[''] flex items-center"
        aria-label="Mark all comments as seen in the current post"
        title="Mark all comments as seen"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 md:h-5 md:w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="ml-1 text-xs hidden md:inline">Mark all seen</span>
      </button>
    </div>
  );
};

export default MarkAllSeen;
