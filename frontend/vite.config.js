import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return;

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router/') ||
            id.includes('/node_modules/scheduler/') ||
            id.includes('/node_modules/loose-envify/') ||
            id.includes('/node_modules/prop-types/')
          ) {
            return 'react-core';
          }

          if (
            id.includes('/node_modules/stream-chat/') ||
            id.includes('/node_modules/stream-chat-react/')
          ) {
            return 'chat-core';
          }

          if (id.includes('/node_modules/@stream-io/video-react-sdk/')) {
            return 'video-core';
          }

          if (
            id.includes('/node_modules/lucide-react/') ||
            id.includes('/node_modules/react-hot-toast/')
          ) {
            return 'ui-core';
          }

          if (
            id.includes('/node_modules/@tanstack/react-query/') ||
            id.includes('/node_modules/zustand/')
          ) {
            return 'state-core';
          }

          return 'vendor-core';
        },
      },
    },
  },
});
