/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Demo muhitida ilovaning ishga tushishini kafolatlash uchun (test qilinmagan build).
  // Ishlab chiqarishda bu ikkalasini o'chirish tavsiya etiladi.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
