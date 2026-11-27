import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { cspMeta } from "./scripts/csp-meta.mjs";

/** Asks the browser for the main text font at once, so headlines do not re-wrap when it arrives late. */
function preloadMainFont(): Plugin {
  return {
    name: "flexs-preload-font",
    apply: "build",
    transformIndexHtml(_html, ctx) {
      const font = Object.keys(ctx.bundle ?? {}).find(name => /urbanist-latin-wght-normal-.*\.woff2$/.test(name));
      return font ? [{ tag: "link", attrs: { rel: "preload", as: "font", type: "font/woff2", href: `/${font}`, crossorigin: "" }, injectTo: "head" }] : [];
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), cspMeta(), preloadMainFont(), mode === "development" && componentTagger()].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-dom") || /node_modules\/react\//.test(id) || id.includes("react-router") || id.includes("scheduler")) return "react";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
