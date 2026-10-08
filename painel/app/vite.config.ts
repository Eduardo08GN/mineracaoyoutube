import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Em desenvolvimento, /api vai para o servidor local do Minerador (agente/servidor.py).
const servidor = process.env.OW_API ?? "http://127.0.0.1:8790";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: servidor, changeOrigin: true, ws: true } },
  },
  build: { chunkSizeWarningLimit: 800 },
});
