/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@paperforge/shared',
    '@paperforge/questions',
    '@paperforge/dedup',
    '@paperforge/classification',
    '@paperforge/pdf',
    '@paperforge/worksheets',
    '@paperforge/db',
  ],
};

module.exports = nextConfig;
