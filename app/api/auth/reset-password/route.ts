import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { rateLimiters, getIP, checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const ip = getIP(request);
  const rate = await checkRateLimit(rateLimiters.resetPassword, ip);
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429 }
    );
  }

  const { token, newPassword, confirmPassword } = await request.json();
  if (!token || !newPassword || newPassword !== confirmPassword) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { error: 'Password must be at least 6 characters' },
      { status: 400 }
    );
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken || verificationToken.expires < new Date()) {
    return NextResponse.json(
      { error: 'Invalid or expired reset token' },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  // Delete used token
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ success: true });
}