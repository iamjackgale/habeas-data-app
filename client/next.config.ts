import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false,
};

export default nextConfig;



// /** @type {import('next').NextConfig} */
// const nextConfig = {
//   reactStrictMode: true,
//   webpack: (config) => {
//     config.resolve.fallback = { fs: false, net: false, tls: false };
//     config.externals.push('pino-pretty', 'lokijs', 'encoding');
//     return config;
//   },
// };

// module.exports = nextConfig;

