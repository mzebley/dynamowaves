<script lang="ts">
	import Api from '$lib/content/api.md';
	import Examples from '$lib/content/examples.md';
	import Installation from '$lib/content/installation.md';
	import Usage from '$lib/content/usage.md';
	import DocsFooter from '$lib/components/DocsFooter.svelte';
	import DocsHeader from '$lib/components/DocsHeader.svelte';
	import DocsNav from '$lib/components/DocsNav.svelte';
	import SsrDynamoWave from '$lib/components/SsrDynamoWave.svelte';
	import { docsSections } from '$lib/docs';
</script>

<svelte:head>
	<title>Dynamowaves documentation — SVG wave custom element</title>
	<meta name="description" content="Complete Dynamowaves 2.2.1 documentation: installation, attributes, methods, events, TypeScript exports, accessibility, and live SVG wave examples." />
	<link rel="canonical" href="https://dynamowaves.markzebley.com/" />
	<link rel="icon" href="/favicon.svg" />
	<link rel="manifest" href="/site.webmanifest" />
	<meta property="og:title" content="Dynamowaves" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://dynamowaves.markzebley.com/" />
	<meta
		property="og:description"
		content="Complete documentation and live examples for the dependency-free Dynamowaves SVG custom element."
	/>
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="Dynamowaves" />
	<meta
		name="twitter:description"
		content="Complete documentation and live examples for the dependency-free Dynamowaves SVG custom element."
	/>
	<meta name="msapplication-TileColor" content="#e4ecec" />
</svelte:head>

<div class="site-shell">
	<DocsHeader />
	<main id="main-content" tabindex="-1">
		<div class="docs-layout">
			<DocsNav sections={docsSections} />
			<article class="docs-column" aria-label="Dynamowaves documentation">
				<section class="docs-section prose" aria-labelledby="installationHeader">
					<Installation />
				</section>
				<section class="docs-section prose" aria-labelledby="usageHeader">
					<Usage />
				</section>
					<section class="docs-section prose" aria-labelledby="api-reference">
					<Api />
				</section>
				<section class="docs-section prose" aria-labelledby="practicalApplicationHeader">
					<Examples />
				</section>
			</article>
		</div>
		<SsrDynamoWave
			class="page-end-wave"
			speed={10000}
			animate
			observe="repeat"
		/>
	</main>
	<DocsFooter />
</div>
