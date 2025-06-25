import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: 'captcha-cook',
  build: {
    outDir: '../captcha',
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      input: {
        captcha: resolve(__dirname, 'captcha-cook/captcha.html')
      }
    }
  },
  base: './'
})
