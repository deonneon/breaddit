import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserBadge = () => {
  const { user, profile, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <a 
        href="/login" 
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        aria-label="Sign in"
        tabIndex={0}
      >
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
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
          />
        </svg>
        <span className="text-sm">Sign In</span>
      </a>
    );
  }

  const userInitial = (profile?.username || user.email || '').charAt(0).toUpperCase();
  const displayName = profile?.username || user.email?.split('@')[0] || 'User';

  return (
    <div className="relative">
      <button
        onClick={toggleMenu}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
        aria-label="User menu"
        aria-expanded={showMenu}
        aria-haspopup="true"
        tabIndex={0}
      >
        {profile?.avatar_url ? (
          <img 
            src={profile.avatar_url} 
            alt={displayName} 
            className="h-8 w-8 rounded-full object-cover" 
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">
            {userInitial}
          </div>
        )}
        <span className="text-sm font-medium">{displayName}</span>
      </button>

      {showMenu && (
        <div 
          className="absolute top-full left-0 mt-1 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10"
          onBlur={() => setShowMenu(false)}
        >
          <div className="py-1">
            <a 
              href="/profile" 
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              tabIndex={0}
            >
              Your Profile
            </a>
            <a 
              href="/settings" 
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              tabIndex={0}
            >
              Settings
            </a>
            <button 
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              tabIndex={0}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBadge; 