import type { MetadataRoute } from "next";

// Lets "Add to Home Screen" open Glad Style full-screen, like an installed app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Glad Style Fashion",
    short_name: "Glad Style",
    description: "Glad Style Fashion store and admin.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/brand/favicon-192-circle.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
