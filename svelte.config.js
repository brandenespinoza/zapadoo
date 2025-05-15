import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(), // Move preprocess here, at the top level
  kit: {
    adapter: adapter({
      out: 'build' // Output directory for the Node.js build
    })
  }
};