import { FC, useState } from "react";

interface MarkAllSeenProps {
  onClick: () => void;
  hasNewComments?: boolean;
}

const MarkAllSeen: FC<MarkAllSeenProps> = ({ onClick, hasNewComments = false }) => {
  const [isChecked, setIsChecked] = useState(false);

  const handleClick = () => {
    setIsChecked(true);
    onClick();
  };

  // Reset the checked state when hasNewComments changes
  if (!hasNewComments && isChecked) {
    setIsChecked(false);
  }

  // If there are no new comments and it's not checked, disable the button
  const isDisabled = !hasNewComments && !isChecked;

  return (
    <div className="md:hidden fixed bottom-8 left-[50%] translate-x-[-50%] z-10">
      <button
        onClick={handleClick}
        className={`opacity-90 ${
          isChecked 
            ? 'bg-gray-300/90 dark:bg-gray-700/90' 
            : hasNewComments 
              ? 'bg-green-700/90 hover:bg-green-800/90' 
              : 'bg-gray-300/90 dark:bg-gray-700/90'
        } text-white dark:text-gray-300 rounded-lg p-2 shadow-xl backdrop-blur-md transition-all duration-200 border border-white/20 relative before:absolute before:inset-[-12px] before:content-[''] flex items-center`}
        aria-label="Mark all comments as seen in the current post"
        title="Mark all comments as seen"
        disabled={isDisabled}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-8"
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
        <span className="ml-1 text-xs hidden">
          {isChecked ? "Marked as seen ✓" : "Mark all seen"}
        </span>
      </button>
    </div>
  );
};

export default MarkAllSeen;
