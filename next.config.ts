import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "pub.outsyde.com" },
      { protocol: "https", hostname: "media.outsyde.com" },
      { protocol: "https", hostname: "media.goutsyde.com" },
    ],
  },
};

export default nextConfig;
