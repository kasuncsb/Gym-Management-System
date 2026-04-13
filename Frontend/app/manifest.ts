import type { MetadataRoute } from "next";

const APP_VERSION = "2.1.0";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymSphere",
    short_name: "GymSphere",
    id: "/pwa",
    description:
      `Sri Lanka fitness network — facilities, trainers, workouts, and member tools. (v${APP_VERSION})`,
    start_url: "/pwa",
    scope: "/",
    display_override: ["standalone", "minimal-ui"],
    display: "standalone",
    orientation: "portrait-primary",
    lang: "en",
    dir: "ltr",
    prefer_related_applications: false,
    background_color: "#1e1e1e",
    theme_color: "#1e1e1e",
    icons: [
      {
        src: "/icons/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/pwa-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Member",
        short_name: "Member",
        description: "Member dashboard",
        url: "/member/dashboard",
        icons: [
          {
            src: "/icons/shortcut-member-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      {
        name: "Trainer",
        short_name: "Trainer",
        description: "Trainer dashboard",
        url: "/trainer/dashboard",
        icons: [
          {
            src: "/icons/shortcut-trainer-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
    ],
  };
}
