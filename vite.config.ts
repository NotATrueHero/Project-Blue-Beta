import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CRITICAL: This ensures assets load correctly on GitHub Pages
  base: './', 
  define: {
    // Prevents "process is not defined" crashes in browser
    'process.env': {} 
  }
})