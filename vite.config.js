import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Zapytania do /api trafiają do serwera Node.js połączonego z MySQL
    proxy: { '/api': 'http://localhost:3001' },
  },
  build: {
    // CodeMirror to sporo kodu — to oczekiwane w tej aplikacji
    chunkSizeWarningLimit: 1000,
  },
})
