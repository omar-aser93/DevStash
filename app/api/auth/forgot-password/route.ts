import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimiters, getIP, checkRateLimit } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/resend';
import { randomBytes } from 'crypto';

export async function POST(request: Request) {
  const ip = getIP(request);
  const rate = await checkRateLimit(rateLimiters.forgotPassword, ip);
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ success: true });
  }

  // Generate token and save to VerificationToken
  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires,
    },
  });

  try {
    await sendPasswordResetEmail(user.email, token, user.name || undefined);
  } catch (error) {
    console.error('Failed to send reset email:', error);
    // Still return success to avoid leaking info
  }

  return NextResponse.json({ success: true });
}