import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendPasswordResetEmail(email: string, token: string, name?: string) {
  const resetLink = `${process.env.AUTH_URL}/reset-password?token=${token}`;
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to: email,
    subject: 'Reset your DevStash password',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #e4e4ef;">DevStash</h1>
        <p>Hello ${name || 'there'},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border-color: #1e1e2e;" />
        <p style="color: #8888a4; font-size: 0.8rem;">DevStash – your developer knowledge hub</p>
      </div>
    `,
    text: `Reset your DevStash password:\n${resetLink}\n\nThis link expires in 1 hour.`,
  });

  if (error) {
    console.error('Resend error:', error);
    throw new Error('Failed to send email');
  }
}