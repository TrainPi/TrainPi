const path = require('path')

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  },
  // In dev, proxy /api to backend to avoid CORS (browser sends to same origin)
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
    ]
  },
  webpack: (config, { isServer }) => {
    const rootPath = path.resolve(process.cwd())
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': rootPath,
    }
    config.resolve.modules = [rootPath, 'node_modules']
    return config
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

