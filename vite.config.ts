import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  // Match Supabase "Site URL" / redirect URLs often configured as http://localhost:3000
  server: {
    port: 3000,
    strictPort: false,
  },
})