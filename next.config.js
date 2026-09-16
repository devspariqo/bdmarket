/** @type {import('next').NextConfig} */
const { execSync } = require('child_process');

/*
 * Build identity, inlined at build time and reported by the health endpoint.
 *
 * Exists because "I pushed a fix but the site still shows the old behaviour" is
 * indistinguishable from "the fix did not work" - and the most common cause is a
 * host that never rebuilt, or built an older commit. Comparing the SHA the live
 * site reports against `git rev-parse origin/main` answers that in one request.
 *
 * .git is not always present at build time (a tarball deploy, for instance), so
 * both values fall back rather than failing the build.
 */
function buildInfo() {
  let sha = 'unknown';
  try {
    sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {}
  return { sha, time: new Date().toISOString() };
}

const build = buildInfo();
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  env: {
    BUILD_SHA: build.sha,
    BUILD_TIME: build.time,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;
