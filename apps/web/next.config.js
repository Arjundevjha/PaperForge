const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingExcludes: {
    '*': [
      './papers/**',
      './paperforge_project_docs/**',
      './storage/**',
      './apps/web/public/answers/**',
      './apps/web/public/questions/**',
      './public/answers/**',
      './public/questions/**',
      './**/*.pdf',
    ],
  },
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
