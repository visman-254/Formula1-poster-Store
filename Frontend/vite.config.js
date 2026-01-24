import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";
import fs from "fs";

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    {
      name: "copy-redirects",
      closeBundle() {
        try {
          fs.copyFileSync("public/_redirects", "dist/_redirects");
          console.log("✅ Copied _redirects to dist/");
        } catch (err) {
          console.warn("⚠️ Could not copy _redirects:", err.message);
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
