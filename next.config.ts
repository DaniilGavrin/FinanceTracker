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
    // Явно указываем, что делать, если сеть недоступна при первом запросе
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // Отключаем попытки Next.js стучаться во внешние источники при сборке
  images: {
    unoptimized: true, // Если не используешь next/image, это ускорит работу
  },
};

export default withPWA(nextConfig);