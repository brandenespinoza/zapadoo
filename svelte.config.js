import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  kit: {
    adapter: adapter({
      // Optional: Specify output directory (defaults to 'build')
      out: 'build'
    }),
    preprocess: vitePreprocess()
  }
};