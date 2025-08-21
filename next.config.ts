import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ddragon.leagueoflegends.com',
        port: '',
        pathname: '/cdn/**/img/champion/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.ko-fi.com',
        port: '',
        pathname: '/cdn/**',
      },
      {
        protocol: 'https',
        hostname: 'img.metasrc.com',
        port: '',
        pathname: '/cdn/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.communitydragon.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/data/:path*.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
