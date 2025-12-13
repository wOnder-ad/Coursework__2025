import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,       // <--- КРИТИЧНО ВАЖЛИВО ДЛЯ DOCKER (відкриває доступ ззовні)
    port: 5173,       // Порт має співпадати з тим, що в docker-compose.yml
    strictPort: true,
    watch: {
      usePolling: true // <--- ВАЖЛИВО ДЛЯ WINDOWS (щоб працював hot reload)
    }
  },
})