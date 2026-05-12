import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    allowedHosts: ['appfsa.com'],
    port: 4200, // o el puerto que estés usando
  },
})
