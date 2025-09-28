import type { NextConfig } from "next";

const nextConfig: NextConfig = {  reactStrictMode: true,
  experimental: {
    turbo: {},
  },
  output: "standalone",   // <-- serve per la build production dockerizzata
};

export default nextConfig;
