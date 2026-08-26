<script lang="ts">
	import { browser } from '$app/environment';
	import '$lib/styles/zbk-dynamowaves.min.css';
	import '$lib/styles/zbk-dark.css';
	import '../app.css';

	let { children } = $props();

	async function registerClientElements() {
		const { applyZebkitConfig } = await import('../../zebkit/zebkit.runtime.js');
		applyZebkitConfig();

		const [
			{ defineZbkButton },
			{ defineZbkCodeBlock },
			{ defineZbkLink },
			{ defineZbkToggle },
		] = await Promise.all([
			import('zebkit/components/button'),
			import('zebkit/components/code-block'),
			import('zebkit/components/link'),
			import('zebkit/components/toggle'),
		]);

		defineZbkButton();
		defineZbkLink();
		defineZbkToggle();
		defineZbkCodeBlock();

		await import('../dynamowaves.js');
	}

	if (browser) {
		void registerClientElements();
	}
</script>

<a class="skip-link" href="#main-content">Skip to documentation</a>
{@render children()}
