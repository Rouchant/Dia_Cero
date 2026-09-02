import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['genkit', '@genkit-ai/core', '@genkit-ai/google-genai', 'express'],
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

