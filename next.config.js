/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {}, // must be an object, not boolean
  },
};

module.exports = nextConfig;
