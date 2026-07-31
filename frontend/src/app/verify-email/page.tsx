'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';

type VerificationState = 'loading' | 'success' | 'error' | 'invalid';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerificationState>('loading');

  useEffect(() => {
    if (!token) {
      setState('invalid');
      return;
    }

    const verifyEmail = async () => {
      try {
        await authService.verifyEmail(token);
        setState('success');
        toast.success('Email verified successfully!');
      } catch (error) {
        setState('error');
        toast.error('Invalid or expired verification link');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-lg shadow-lg p-8"
      >
        <div className="text-center">
          {state === 'loading' && (
            <>
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifying your email...</h1>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
              <p className="text-gray-600 mb-6">
                Your email has been successfully verified. You can now log in to your account.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full btn-primary py-3 rounded-lg font-semibold"
              >
                Go to Login
              </button>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h1>
              <p className="text-gray-600 mb-6">
                The verification link is invalid or has expired. Please request a new verification email.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/login')}
                  className="w-full btn-primary py-3 rounded-lg font-semibold"
                >
                  Go to Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="w-full btn-outline py-3 rounded-lg font-semibold"
                >
                  Create New Account
                </button>
              </div>
            </>
          )}

          {state === 'invalid' && (
            <>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
              <p className="text-gray-600 mb-6">
                No verification token was provided. Please check your email for the correct link.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="w-full btn-primary py-3 rounded-lg font-semibold"
              >
                Go to Login
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary flex items-center justify-center"><div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
