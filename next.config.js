/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for @neondatabase/serverless on Vercel edge/serverless
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
}

module.exports = nextConfig
