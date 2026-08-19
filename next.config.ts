import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: new URL(process.env.R2_PUBLIC_URL || "").hostname,
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
