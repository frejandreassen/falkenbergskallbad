/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
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
