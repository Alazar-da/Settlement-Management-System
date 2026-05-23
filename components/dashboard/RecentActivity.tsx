'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FiUpload, 
  FiDollarSign, 
  FiUserCheck, 
  FiAlertCircle,
  FiClock,
  FiChevronRight 
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'upload' | 'payment' | 'status_change' | 'alert';
  title: string;
  description: string;
  amount?: number;
  timestamp: Date;
  status?: 'success' | 'warning' | 'info';
}

interface RecentActivityProps {
  activities?: Activity[];
}

const defaultActivities: Activity[] = [
  {
    id: '1',
    type: 'upload',
    title: 'Weekly Settlement Uploaded',
    description: 'Alpha system settlement for week 48',
    amount: 125000,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'success',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Received',
    description: 'Golden Crown - Partial payment',
    amount: 25000,
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    status: 'success',
  },
  {
    id: '3',
    type: 'status_change',
    title: 'Agent Status Updated',
    description: 'Royal Palace marked as Fully Paid',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    status: 'info',
  },
  {
    id: '4',
    type: 'alert',
    title: 'Payment Overdue',
    description: 'Diamond Casino - 30 days overdue',
    amount: 76000,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    status: 'warning',
  },
  {
    id: '5',
    type: 'upload',
    title: 'Kiron 2 Settlement',
    description: 'Weekly settlement processed',
    amount: 98000,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    status: 'success',
  },
];

export default function RecentActivity({ activities = [] }: RecentActivityProps) {
  const [activityList, setActivityList] = useState<Activity[]>(defaultActivities);

  useEffect(() => {
    if (activities && activities.length > 0) {
      setActivityList(activities);
    }
  }, [activities]);

  const getActivityIcon = (type: Activity['type'], status?: string) => {
    switch (type) {
      case 'upload':
        return <FiUpload className="w-4 h-4 text-blue-500" />;
      case 'payment':
        return <FiDollarSign className="w-4 h-4 text-green-500" />;
      case 'status_change':
        return <FiUserCheck className="w-4 h-4 text-purple-500" />;
      case 'alert':
        return <FiAlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FiClock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'border-l-4 border-green-500';
      case 'warning':
        return 'border-l-4 border-yellow-500';
      case 'info':
        return 'border-l-4 border-blue-500';
      default:
        return 'border-l-4 border-gray-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden h-full"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Latest actions and updates
            </p>
          </div>
          <div className="flex items-center space-x-1 text-sm text-primary-600 dark:text-primary-400">
            <span>View all</span>
            <FiChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
        {activityList.map((activity, index) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 ${getStatusColor(activity.status)}`}
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  {getActivityIcon(activity.type, activity.status)}
                </div>
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.title}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                  </p>
                </div>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {activity.description}
                </p>
                
                {activity.amount && (
                  <div className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700">
                    <FiDollarSign className="w-3 h-3 text-gray-500 mr-1" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {activity.amount.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Today</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {activityList.filter(a => {
                const today = new Date();
                const activityDate = new Date(a.timestamp);
                return activityDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">This Week</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {activityList.filter(a => {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return new Date(a.timestamp) > weekAgo;
              }).length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Payments</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              ${activityList
                .filter(a => a.type === 'payment')
                .reduce((sum, a) => sum + (a.amount || 0), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}