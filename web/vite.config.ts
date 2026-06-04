import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/** Production origin for absolute og:image (required by iMessage, Slack, etc.). */
function resolveSiteOrigin(): string {
  const explicit = process.env.VITE_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) {
    return production.startsWith("http")
      ? production.replace(/\/$/, "")
      : `https://${production}`;
  }

  const deployment = process.env.VERCEL_URL?.trim();
  if (deployment) return `https://${deployment}`;

  return "";
}

/** Absolute og:image for link previews (Vercel injects origin at build). */
function socialMetaPlugin(): Plugin {
  const site = resolveSiteOrigin();
  const ogImage = site
    ? `${site}/images/landing/og.jpg`
    : "/images/landing/og.jpg";

  return {
    name: "social-meta",
    transformIndexHtml(html) {
      let out = html.replaceAll("%OG_IMAGE_URL%", ogImage);
      if (site) {
        out = out.replaceAll("%SITE_ORIGIN%", site);
      } else {
        out = out.replace(
          /\s*<meta property="og:url" content="%SITE_ORIGIN%\/" \/>\n?/,
          "",
        );
      }
      return out;
    },
  };
}

export default defineConfig({
  plugins: [react(), socialMetaPlugin()],
  resolve: {
    alias: {
      "@lib": path.resolve(__dirname, "../lib"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
