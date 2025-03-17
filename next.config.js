/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { 
    unoptimized: false,
    domains: ['supabasekong-u0k8kkksk4k8ccw0ow0kg084.breaktheice.in'],
    formats: ['image/avif', 'image/webp']
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
    turbo: {
      rules: {
        '*.svg': ['@svgr/webpack']
      }
    }
  }
}

module.exports = nextConfig;
