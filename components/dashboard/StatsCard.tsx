'use client';

import { motion } from 'framer-motion';
import { IconType } from 'react-icons';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  color: string;
  change?: string;
  subtitle?: string;
}

export default function StatsCard({ title, value, icon: Icon, color, change, subtitle }: StatsCardProps) {
  const isPositive = change ? parseFloat(change) > 0 : false;
  
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 bg-gradient-to-br ${color} opacity-10 rounded-full`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}>
            <Icon className="w-6 h-6" />
          </div>
          {change && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-semibold ${
              isPositive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {isPositive ? <FiTrendingUp className="w-3 h-3" /> : <FiTrendingDown className="w-3 h-3" />}
              <span>{change}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {title}
        </p>
        
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}