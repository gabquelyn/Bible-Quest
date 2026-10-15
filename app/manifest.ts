import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bible in a Year",
    short_name: "Bible",
    description: "Read the Bible in a year with your group.",
    start_url: "/register",
    scope: "/",
    display: "standalone", // hides the browser UI so it feels like an app
    orientation: "portrait",
    background_color: "#ffffff", // splash screen background
    theme_color: "#ffffff", // status bar / title bar color
    icons: [
      { src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
