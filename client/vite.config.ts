import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import checker from "vite-plugin-checker";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    checker({
      typescript: false,
    }),
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
