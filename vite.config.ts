import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/cesium/Build/Cesium/Workers', dest: 'cesium' },
        { src: 'node_modules/cesium/Build/Cesium/Assets', dest: 'cesium' },
        { src: 'node_modules/cesium/Build/Cesium/Widgets', dest: 'cesium' }
      ]
    })
  ],
  define: {
    CESIUM_BASE_URL: JSON.stringify('/cesium'),
    CESIUM_ION_TOKEN: JSON.stringify(process.env.VITE_CESIUM_ION_TOKEN || 'your-cesium-ion-token')
  },
  optimizeDeps: {
    exclude: ['@cesium/engine']
  },
  build: {
    rollupOptions: {
      external: ['satellite.js', '@cesium/engine'],
      output: {
        globals: {
          'satellite.js': 'satellite',
          '@cesium/engine': 'Cesium'
        }
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error, falling back to direct API calls')
          })
        }
      }
    }
  }
})
