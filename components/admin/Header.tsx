'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiMenu,
  FiSun,
  FiMoon,
  FiChevronDown,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuClick: () => void;
  user: any;
}

export default function Header({ onMenuClick, user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const { theme, setTheme } = useTheme();

  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Logout
  const logout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  // Page title
  const getPageTitle = () => {
    if (pathname === '/admin/dashboard') return 'Dashboard';

    if (pathname === '/admin/reports') return 'Reports';

    if (pathname === '/admin/profile') return 'Profile';

    if (pathname === '/admin/agents') return 'Agents';

    if (pathname === '/admin/cashiers') return 'Cashiers';

    if (pathname === '/admin/systems') return 'Systems';

    return 'Admin Panel';
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-4 md:px-6 py-4">
        {/* Left */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>

          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 dark:text-white">
              {getPageTitle()}
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
              Welcome back, {user?.email?.split('@')[0] || 'Admin'}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={() =>
              setTheme(theme === 'dark' ? 'light' : 'dark')
            }
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? (
              <FiSun className="w-5 h-5 text-yellow-500" />
            ) : (
              <FiMoon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>

              {/* Username */}
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-gray-800 dark:text-white leading-none">
                  {user?.username?.charAt(0).toUpperCase()+ user?.username?.slice(1) || 'Admin'}
                </p>

                {/* <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                  {user?.username}
                </p> */}
              </div>

              <FiChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
                        {user?.username?.charAt(0).toUpperCase() || 'A'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {user?.username?.charAt(0).toUpperCase()+ user?.username?.slice(1) || 'Admin'}
                        </p>

                       {/*  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {user?.username}
                        </p> */}
                      </div>
                    </div>
                  </div>

                  {/* Menu */}
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/admin/profile');
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <FiUser className="w-5 h-5 text-gray-500" />

                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Profile
                      </span>
                    </button>

                    <button
                      onClick={logout}
                      className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
                    >
                      <FiLogOut className="w-5 h-5 text-red-500" />

                      <span className="text-sm font-medium text-red-500">
                        Logout
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}