import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    // Caminho base do site. Use "/" na raiz do domínio ou "/loja/" em subpasta.
    base: env.VITE_BASE_PATH || '/',
    server: {
      port: 5173,
      // Em desenvolvimento, /api é encaminhado para o FastAPI local
      proxy: {
        '/api': { target: env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: true },
        '/media': { target: env.VITE_DEV_API_TARGET || 'http://127.0.0.1:8000', changeOrigin: true },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
          },
        },
      },
    },
  };
});
