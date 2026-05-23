'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiBarChart2, 
  FiUser, 
  FiUpload,
  FiSettings 
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import ThemeToggle from './ThemeToggle';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: FiHome },
  { name: 'Reports', href: '/reports', icon: FiBarChart2 },
  { name: 'Upload', href: '/upload', icon: FiUpload },
  { name: 'Profile', href: '/profile', icon: FiUser },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <motion.aside 
      initial={{ x: -200 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl z-20"
    >
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Settlement Pro
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 5 }}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-800">
          <ThemeToggle />
        </div>
      </div>
    </motion.aside>
  );
}