import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiUrl =
    env.VITE_API_URL ||
    env.BACKEND_URL ||
    process.env.VITE_API_URL ||
    process.env.BACKEND_URL ||
    ''

  return {
    plugins: [react(), tailwindcss()],
    envPrefix: ['VITE_', 'BACKEND_'],
    define: apiUrl ? {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    } : {},
  }
})
