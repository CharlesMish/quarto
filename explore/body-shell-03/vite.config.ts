import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5185,
    host: "127.0.0.1",
    strictPort: true,
  },
  preview: {
    port: 4185,
    host: "127.0.0.1",
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
