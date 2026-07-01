import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // .env dosyasındaki verileri yükle
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        // 🔥 SENTRIX SÜPER VİZYON MOTORU KÖPRÜSÜ
        '/colab-api': {
          // URL'yi otomatik olarak .env dosyasından çeker
          target: env.VITE_SENTRIX_API_URL,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/colab-api/, ''),
          headers: {
            'ngrok-skip-browser-warning': 'true',
            'Accept': 'image/png, */*'
          }
        },
        // HuggingFace Köprüsü (Gerekirse)
        '/hf-api': {
          target: 'https://api-inference.huggingface.co',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/hf-api/, '')
        }
      }
    }
  }
})