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
    // КРИТИЧНО: что отдавать при навигации оффлайн
    navigateFallback: "/offline.html",
    // Кэшировать все навигационные запросы
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: {
            maxEntries: 4,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
        },
      },
      {
        // Кэшировать все навигации (HTML-страницы)
        urlPattern: ({ request }) => request.mode === "navigate",
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
          },
        },
      },
      {
        // Кэшировать статику (JS, CSS, картинки)
        urlPattern: ({ request }) => 
          request.destination === "script" ||
          request.destination === "style" ||
          request.destination === "image" ||
          request.destination === "font",
        handler: "CacheFirst",
        options: {
          cacheName: "static-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 365 * 24 * 60 * 60, // 1 год
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
};

export default withPWA(nextConfig);