import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Только fallback для оффлайна, всё остальное делает библиотека
    navigateFallback: "/offline.html",
    navigateFallbackAllowlist: [/^\/$/],
  },
});

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);