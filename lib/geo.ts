import { headers } from 'next/headers';

export async function getUserCountry(): Promise<string> {
  const requestHeaders = await headers();   // get the headers

  // 1. Check country from platform headers (Vercel, Cloudflare, Netlify, ...)
  const vercelCountry = requestHeaders.get('x-vercel-ip-country');
  if (vercelCountry) return vercelCountry.toUpperCase();

  const cfCountry = requestHeaders.get('cf-ipcountry');
  if (cfCountry) return cfCountry.toUpperCase();

  const netlifyCountry = requestHeaders.get('x-country');
  if (netlifyCountry) return netlifyCountry.toUpperCase();

  const awsCountry = requestHeaders.get('cloudfront-viewer-country');
  if (awsCountry) return awsCountry.toUpperCase();

  // 2. If running on VPS / self-hosted, use external API
  try {
    const forwardedFor = requestHeaders.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0]?.trim();

    if (ip) {
      const res = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=countryCode`,
        {
          headers: {
            Accept: 'application/json',
          },
          signal: AbortSignal.timeout(2000),
        }
      );

      if (res.ok) {
        const data = await res.json();

        if (data.countryCode) {
          return data.countryCode.toUpperCase();
        }
      }
    }
  } catch (error) {
    console.warn('GeoIP fallback failed:', error);
  }

  // 3. Default fallback
  return 'US';
}