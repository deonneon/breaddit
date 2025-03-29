import { FC } from "react";

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToTop: FC<ScrollToTopProps> = ({ show, onClick }) => {
  return (
    <div className="fixed bottom-8 left-[65%] translate-x-[-50%] z-10">
      <button
        onClick={onClick}
        className={`
          ${
            show
              ? "opacity-90 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }
          bg-gray-400/90 dark:bg-gray-700/90 hover:bg-orange-600/90 text-white dark:text-gray-300 
          rounded-lg p-2 shadow-xl backdrop-blur-md
          transition-all duration-200 border border-white/20
          relative before:absolute before:inset-[-12px] before:content-['']
        `}
        aria-label="Scroll to top"
        title="Back to top"
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
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
};

export default ScrollToTop;
