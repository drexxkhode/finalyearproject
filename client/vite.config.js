import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // 👈 VERY IMPORTANT
    port: 3000,
    allowedHosts: [
      '.ngrok-free.app',
      '.trycloudflare.com'
    ]
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});