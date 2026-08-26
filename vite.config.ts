import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// Zebkit generates its project runtime at the repository root. SvelteKit's
			// default dev allow-list is source-only, so explicitly serve that artifact.
			allow: [fileURLToPath(new URL('.', import.meta.url))],
		},
	},
});
