/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // better-sqlite3 is a native module and must not be bundled
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
