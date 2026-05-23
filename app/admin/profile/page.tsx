// components/profile/Profile.tsx

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Profile() {
  const [user, setUser] = useState<any>(null);

  const [username, setUsername] =
    useState('');

  const [currentPassword, setCurrentPassword] =
    useState('');

  const [newPassword, setNewPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState('');

  useEffect(() => {
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    const storedUser =
      localStorage.getItem('user');

    if (!storedUser) return;

    const parsed =
      JSON.parse(storedUser);

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
    try {
      setLoading(true);
      setMessage('');

      if (!user) return;

      // username validation
      if (!username.trim()) {
        setMessage(
          'Username is required'
        );
        return;
      }

      // password validation
      if (
        newPassword ||
        confirmPassword ||
        currentPassword
      ) {
        if (
          currentPassword !==
          user.password
        ) {
          setMessage(
            'Current password is incorrect'
          );
          return;
        }

        if (
          newPassword !==
          confirmPassword
        ) {
          setMessage(
            'Passwords do not match'
          );
          return;
        }

        if (
          newPassword.length < 4
        ) {
          setMessage(
            'Password must be at least 4 characters'
          );
          return;
        }
      }

      const updateData: any = {
        username,
      };

      if (newPassword) {
        updateData.password =
          newPassword;
      }

      const { error } =
        await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

      if (error) {
        setMessage(error.message);
        return;
      }

      // update local storage
      const updatedUser = {
        ...user,
        username,
      };

      localStorage.setItem(
        'user',
        JSON.stringify(updatedUser)
      );

      setMessage(
        'Profile updated successfully'
      );

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      getCurrentUser();
    } catch (err: any) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Profile Settings
        </h1>

        <p className="text-muted-foreground mt-1">
          Update your account details
        </p>
      </div>

      <div className="space-y-5">
        {/* Username */}
        <div>
          <label className="text-sm font-medium">
            Username
          </label>

          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            className="w-full mt-2 border rounded-xl p-3 bg-background"
            placeholder="Enter username"
          />
        </div>

        {/* Divider */}
        <div className="border-t pt-5">
          <h2 className="font-semibold text-lg">
            Change Password
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Leave blank if you do not want to change password
          </p>
        </div>

        {/* Current Password */}
        <div>
          <label className="text-sm font-medium">
            Current Password
          </label>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) =>
              setCurrentPassword(
                e.target.value
              )
            }
            className="w-full mt-2 border rounded-xl p-3 bg-background"
            placeholder="Current password"
          />
        </div>

        {/* New Password */}
        <div>
          <label className="text-sm font-medium">
            New Password
          </label>

          <input
            type="password"
            value={newPassword}
            onChange={(e) =>
              setNewPassword(
                e.target.value
              )
            }
            className="w-full mt-2 border rounded-xl p-3 bg-background"
            placeholder="New password"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="text-sm font-medium">
            Confirm Password
          </label>

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(
                e.target.value
              )
            }
            className="w-full mt-2 border rounded-xl p-3 bg-background"
            placeholder="Confirm password"
          />
        </div>

        {/* Message */}
        {message && (
          <div className="p-3 rounded-xl bg-muted text-sm">
            {message}
          </div>
        )}

        {/* Button */}
        <div className="pt-2">
          <button
            onClick={updateProfile}
            disabled={loading}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl"
          >
            {loading
              ? 'Saving...'
              : 'Update Profile'}
          </button>
        </div>
      </div>
    </div>
  );
}