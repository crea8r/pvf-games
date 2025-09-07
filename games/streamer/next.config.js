/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
    swcMinify: true,
    trailingSlash: true,
    exportPathMap: async function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
    ) {
      return {
        '/': { page: '/' },
      }
    },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig