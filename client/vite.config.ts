import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";

function cspNoncePlugin(): Plugin {
  return {
    name: "vite-plugin-csp-nonce",
    enforce: "post",
    generateBundle(_, bundle) {
      for (const fileName in bundle) {
        const chunkOrAsset = bundle[fileName];

        if (chunkOrAsset.type === "asset" && fileName.endsWith(".html")) {
          // Now TS knows source exists
          let html = chunkOrAsset.source as string;

          // Add nonce placeholder to all script tags
          html = html.replace(/<script /g, `<script nonce="{{CSP_NONCE}}" `);

          // Add nonce placeholder to modulepreload links
          html = html.replace(
            /<link rel="modulepreload"/g,
            `<link rel="modulepreload" nonce="{{CSP_NONCE}}" `
          );

          // Update the asset
          chunkOrAsset.source = html;
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({
      typescript: false,
    }),
    cspNoncePlugin(),
  ],
  optimizeDeps: {
    include: ["browser-image-compression"],
  },

  server: {
    port: 8070,
    host: "0.0.0.0",
    proxy: {
      "/hard_verify/api/v1.0": {
        target: "http://localhost:8071",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
