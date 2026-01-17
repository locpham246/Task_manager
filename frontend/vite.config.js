import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fix Windows permission issue by using a cache directory outside node_modules
  cacheDir: path.resolve(__dirname, '.vite'),
  server: {
    host: true,      // or "0.0.0.0"
    port: 5173,
    // Allow access from production domain
    allowedHosts: [
      'it.ductridn.com',
      '.ductridn.com',  // Allows all subdomains
      'localhost',
      '127.0.0.1'
    ],
    // Use unsafe-none for development to suppress HMR warnings
    // Backend still sets appropriate COOP headers for OAuth security
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    }
  }
})
