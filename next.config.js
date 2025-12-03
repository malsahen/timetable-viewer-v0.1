/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb', // Allow large ZIP uploads
    },
  },
};

module.exports = nextConfig;
