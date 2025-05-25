import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Force development mode
  mode = 'development';
  
  // Load env file based on `mode` in the current directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Force API URL to localhost
  env.VITE_API_URL = 'http://15.207.114.204:5000';
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      sourcemap: true,
      commonjsOptions: {
        include: [/node_modules/],
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: true
    },
    define: {
      'process.env': env
    }
  };
});
