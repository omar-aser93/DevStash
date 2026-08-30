import type { Metadata } from 'next';

import ResetPasswordForm from '@/components/auth/reset-password-form';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Set a new password for your DevStash account.',
};

export default function ResetPasswordPage() {
  return (
      <>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#e4e4ef] mb-8">
            Set new password
          </h1>

          <p className="mt-1 text-sm text-[#8888a4]">
            Enter your new password below.
          </p>
        </div>

        <ResetPasswordForm />
      </>
  );
}

