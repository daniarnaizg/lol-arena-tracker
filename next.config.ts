import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'ddragon.leagueoflegends.com',
        port: '',
        pathname: '/cdn/15.14.1/img/champion/**',
      },
    ],
  },
};

export default nextConfig;
