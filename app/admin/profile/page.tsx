'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiUser,
  FiLock,
  FiSave,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
} from 'react-icons/fi';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import bcrypt from 'bcryptjs';

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      return;
    }
    
    let strength = 0;
    if (newPassword.length >= 6) strength += 25;
    if (newPassword.length >= 10) strength += 25;
    if (/[A-Z]/.test(newPassword)) strength += 25;
    if (/[0-9]/.test(newPassword)) strength += 25;
    
    setPasswordStrength(strength);
  }, [newPassword]);

  async function getCurrentUser() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;

    const parsed = JSON.parse(storedUser);
    
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', parsed.id)
      .single();

    if (data) {
      setUser(data);
      setUsername(data.username);
    }
  }

async function updateProfile() {
  if (!username.trim()) {
    toast.error('Username is required');
    return;
  }

  if (username.length < 3) {
    toast.error(
      'Username must be at least 3 characters'
    );
    return;
  }

  setLoading(true);

  try {
    // get latest user
    const { data: dbUser, error: fetchError } =
      await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

    if (fetchError || !dbUser) {
      toast.error('User not found');
      return;
    }

    // password change validation
    if (
      currentPassword ||
      newPassword ||
      confirmPassword
    ) {
      if (!currentPassword) {
        toast.error(
          'Current password is required'
        );
        return;
      }

      // bcrypt compare
      const validPassword =
        await bcrypt.compare(
          currentPassword,
          dbUser.password
        );

      if (!validPassword) {
        toast.error(
          'Current password is incorrect'
        );
        return;
      }

      if (!newPassword) {
        toast.error(
          'New password is required'
        );
        return;
      }

      if (newPassword.length < 4) {
        toast.error(
          'Password must be at least 4 characters'
        );
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error(
          'Passwords do not match'
        );
        return;
      }
    }

    const updateData: any = {
      username,
    };

    // hash new password
    if (newPassword) {
      const hashedPassword =
        await bcrypt.hash(newPassword, 10);

      updateData.password =
        hashedPassword;
    }

    // update user
    const { error: updateError } =
      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

    if (updateError) {
      toast.error(updateError.message);
      return;
    }

    // update local storage
    const updatedUser = {
      ...dbUser,
      username,
    };

    localStorage.setItem(
      'user',
      JSON.stringify(updatedUser)
    );

    setUser(updatedUser);

    toast.success(
      'Profile updated successfully'
    );

    // clear fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  } catch (err: any) {
    console.log(err);

    toast.error(
      err.message ||
        'Failed to update profile'
    );
  } finally {
    setLoading(false);
  }
}

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage your account details
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
      >
        {/* Avatar Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white text-2xl font-bold">
            {username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {username || 'User'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Administrator
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-5">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="pt-2">
            <div className="flex items-center space-x-2 mb-4">
              <FiLock className="w-4 h-4 text-gray-500" />
              <h3 className="font-medium text-gray-900 dark:text-white">
                Change Password
              </h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Leave blank if you don't want to change your password
            </p>
          </div>

          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showCurrentPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showNewPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>

            {/* Password Strength */}
            {newPassword && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-500 dark:text-gray-400">Password strength:</span>
                  <span className={`font-medium ${getPasswordStrengthColor().replace('bg-', 'text-')}`}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                  <div
                    className={`${getPasswordStrengthColor()} rounded-full h-1 transition-all duration-300`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={updateProfile}
            disabled={loading}
            className="flex items-center justify-center space-x-2 w-full px-6 py-2.5 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <FiSave className="w-4 h-4" />
                <span>Update Profile</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}