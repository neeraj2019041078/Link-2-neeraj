import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This exposes the dev server to your local network and tunnels like Ngrok
    port: 1201, // Optional: set your dev port explicitly
  },
});
