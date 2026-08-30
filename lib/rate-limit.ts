import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create separate limiters for different endpoints
export const rateLimiters = {
  // Login: 5 attempts per 15 minutes, keyed by IP + email
  login: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:login',
  }),
  // Register: 3 attempts per hour, keyed by IP
  register: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'ratelimit:register',
  }),
  // Forgot password: 3 attempts per hour, keyed by IP
  forgotPassword: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    prefix: 'ratelimit:forgot-password',
  }),
  // Reset password: 5 attempts per 15 minutes, keyed by IP
  resetPassword: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'ratelimit:reset-password',
  }),
  // Resend verification (if used): 3 per 15 min, keyed by IP + email
  resendVerification: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '15 m'),
    prefix: 'ratelimit:resend-verification',
  }),
  aiFeatures: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 h'),
    prefix: 'ratelimit:ai',
  })
};

export function getIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

export async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<{ success: boolean; remaining: number; reset: Date }> {
  try {
    const { success, remaining, reset } = await limiter.limit(key);
    return { success, remaining, reset: new Date(reset) };
  } catch (error) {
    // Fail open: allow request if Redis is unavailable
    console.error('Rate limit error:', error);
    return { success: true, remaining: Infinity, reset: new Date() };
  }
}