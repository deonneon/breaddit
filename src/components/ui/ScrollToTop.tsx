import { FC } from 'react';

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToTop: FC<ScrollToTopProps> = ({ show, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-4 right-7 z-50
        md:hidden
        ${
          show
            ? "opacity-70 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }
        bg-gray-800/70 hover:bg-gray-700 text-white
        rounded-full p-2 shadow-md backdrop-blur-sm
        transition-all duration-200
      `}
      aria-label="Scroll to top"
      title="Back to top"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
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
  );
};

export default ScrollToTop; 