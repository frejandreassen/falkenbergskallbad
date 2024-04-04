/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.falkenbergskallbad.se',
        port: '',
      },
    ],
  },
};

export default nextConfig;
