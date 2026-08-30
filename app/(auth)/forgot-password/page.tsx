import type { Metadata } from 'next';
import Link from 'next/link';

import ForgotPasswordForm from '@/components/auth/forgot-password-form';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your DevStash password.',
};

export default function ForgotPasswordPage() {
  return (
   
      <>


        <ForgotPasswordForm />

        <p className="text-center text-sm text-[#8888a4] mt-4">
          Remember your password?{' '}
          <Link
            href="/sign-in"
            className="text-blue-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
    </>
  
  );
}

