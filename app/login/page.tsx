'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  FiUser,
  FiLock,
  FiLogIn,
  FiEye,
  FiEyeOff,
  FiShield,
} from 'react-icons/fi';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/admin/dashboard');
    }
  }, [router]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Invalid credentials');
        return;
      }

      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success('Login successful!');
      router.push('/admin/dashboard');
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-secondary-900 flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Login Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary-400 to-secondary-400 flex items-center justify-center">
                <FiShield className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Settlement Pro</h1>
            <p className="text-gray-300 text-sm">Sign in to your account</p>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('username')}
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter your username"
                    autoComplete="username"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-600 rounded-lg bg-white/5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    ) : (
                      <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-300" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              {/* Forgot Password Link */}
             {/*  <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Forgot password?
                </Link>
              </div> */}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <FiLogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Demo Credentials */}
          {/*   <div className="mt-6 pt-6 border-t border-gray-700">
              <p className="text-xs text-center text-gray-400 mb-3">
                Demo Credentials (First Time Setup)
              </p>
              <div className="bg-white/5 rounded-lg p-3 space-y-1">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Username:</span> admin
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Password:</span> Admin123!
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  * For first-time setup, use these credentials or register a new account
                </p>
              </div>
            </div> */}

            {/* Register Link */}
         {/*    <div className="text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{' '}
                <Link
                  href="/register"
                  className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
                >
                  Register now
                </Link>
              </p>
            </div> */}
          </div>
        </div>

        {/* Footer Features */}
   {/*      <div className="mt-6 flex justify-center space-x-6">
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-400">Secure Connection</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
            <span className="text-xs text-gray-400">24/7 Support</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
            <span className="text-xs text-gray-400">GDPR Compliant</span>
          </div>
        </div> */}
      </motion.div>
    </div>
  );
}