import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Compiler for performance
  reactCompiler: true,

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Compress responses for better performance
  compress: true,

  // Image optimization settings
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Production optimizations
  productionBrowserSourceMaps: false,
};

export default nextConfig;
