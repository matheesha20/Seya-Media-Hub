/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'cdn.seya.media'],
  },
}

module.exports = nextConfig
