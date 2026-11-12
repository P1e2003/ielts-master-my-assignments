import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Xuất gói chạy độc lập (standalone) để tối ưu dung lượng khi đóng gói Docker.
  output: "standalone",
};

export default nextConfig;

