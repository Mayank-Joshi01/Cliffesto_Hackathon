
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.meesho.com",
        pathname: "/images/products/**",
      },
    ],
  },
};

export default nextConfig;
