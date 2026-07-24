import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'marketfiyati.org.tr',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.marketfiyati.org.tr',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
