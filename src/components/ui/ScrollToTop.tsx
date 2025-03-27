import { FC } from "react";

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
}

const ScrollToTop: FC<ScrollToTopProps> = ({ show, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-40 right-3 z-10
        md:bottom-8 md:right-8
        ${
          show
            ? "opacity-90 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }
        bg-orange-500/80 hover:bg-orange-600/90 text-white
        rounded-full p-3 shadow-lg backdrop-blur-sm
        transition-all duration-200 border border-white/10
      `}
      aria-label="Scroll to top"
      title="Back to top"
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
          d="M5 10l7-7m0 0l7 7m-7-7v18"
        />
      </svg>
    </button>
  );
};

export default ScrollToTop;
