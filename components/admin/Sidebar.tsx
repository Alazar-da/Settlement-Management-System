'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FiHome,
  FiBarChart2,
  FiUser,
  FiLogOut,
  FiX,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiSettings,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  currentPath: string;
}

const navItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: FiHome,
    description: 'Overview & analytics',
  },
  {
    name: 'Reports',
    href: '/admin/reports',
    icon: FiBarChart2,
    description: 'Settlement reports',
  },
  {
    name: 'Profile',
    href: '/admin/profile',
    icon: FiUser,
    description: 'Account settings',
  },
];

export default function Sidebar({ isOpen, onClose, user, currentPath }: SidebarProps) {
  const router = useRouter();

   const logout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Logo Section */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Settlement Pro</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
        
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-lg">
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">
              {user?.email?.split('@')[0] || 'Admin User'}
            </p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.href || currentPath?.startsWith(item.href + '/');
          
          return (
            <Link key={item.name} href={item.href} onClick={onClose}>
              <motion.div
                whileHover={{ x: 5 }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-700/50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className={`text-xs ${isActive ? 'text-gray-200' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="w-1 h-8 bg-white rounded-full"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-200 group"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
        
        {/* Version Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">Version 1.0.0</p>
          <p className="text-xs text-gray-600">© 2024 Settlement Pro</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-screen w-64 bg-gray-900 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            {/* Sidebar */}
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 left-0 h-screen w-64 z-50 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}