/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: "/portal",
        destination: "/",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
