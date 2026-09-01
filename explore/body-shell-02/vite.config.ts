import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5184,
    host: "127.0.0.1",
    strictPort: true,
  },
  preview: {
    port: 4184,
    host: "127.0.0.1",
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
