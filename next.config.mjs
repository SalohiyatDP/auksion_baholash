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
  webpack: (config) => {
    // shpjs/togeojson kabi kutubxonalar uchun brauzerda node core modullarini o'chirish
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      stream: false,
      zlib: false,
    };
    return config;
  },
};

export default nextConfig;
