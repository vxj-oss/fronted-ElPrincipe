import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    background: '#0f172a',
    padding: 0.18,
  },
  images: ['public/favicon.svg'],
})
