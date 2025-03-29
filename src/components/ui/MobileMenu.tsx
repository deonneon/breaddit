import { FC } from "react";

interface MobileMenuProps {
  show: boolean;
  onClick: () => void;
}

const MobileMenu: FC<MobileMenuProps> = ({ show, onClick }) => {
  return (
    <div className="fixed bottom-8 left-[35%] translate-x-[-50%] z-10 md:hidden">
      <button
        onClick={onClick}
        className={`
          ${
            show
              ? "opacity-90 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }
          bg-gray-300/90 dark:bg-gray-700/90 hover:bg-orange-600/90 text-white dark:text-gray-300 
          rounded-lg p-2 shadow-xl backdrop-blur-md
          transition-all duration-200 border border-white/20
          relative before:absolute before:inset-[-12px] before:content-['']
        `}
        aria-label="Open mobile sidebar"
        title="Open sidebar"
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
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );
};

export default MobileMenu; 