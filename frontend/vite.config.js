import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // The shadcn UI primitives emit Tailwind v4 `--spacing()` tokens that the
    // default lightningcss minifier rejects, so skip CSS minification.
    cssMinify: false,
  },
})