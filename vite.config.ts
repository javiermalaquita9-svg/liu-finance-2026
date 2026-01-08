import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // LOGICA CLAVE:
  // Si el comando es 'serve' (npm run dev), usa la raíz '/'.
  // Si es build (para subir a GH), usa el nombre del repo '/liu-finance-2026/'.
  const isDev = command === 'serve';

  return {
    base: isDev ? '/' : '/liu-finance-2026/',
    
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});