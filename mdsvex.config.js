import { escapeSvelte } from 'mdsvex';
import { bundledThemes, createHighlighter } from 'shiki';

/** @type {Record<string, import('shiki').BundledLanguage>} */
const languages = {
	bash: 'bash',
	css: 'css',
	html: 'html',
	javascript: 'javascript',
	js: 'javascript',
	json: 'json',
	sh: 'bash',
	svelte: 'svelte',
	ts: 'typescript',
	typescript: 'typescript',
};

const languageLabels = {
	bash: 'Shell',
	css: 'CSS',
	html: 'HTML',
	javascript: 'JavaScript',
	js: 'JavaScript',
	json: 'JSON',
	sh: 'Shell',
	svelte: 'Svelte',
	ts: 'TypeScript',
	typescript: 'TypeScript',
};

function getMetaTokens(metastring = '') {
	if (typeof metastring !== 'string') return [];

	return metastring
		.trim()
		.split(/\s+/)
		.map((token) => token.replace(/^\{|\}$/g, ''))
		.filter(Boolean);
}

function getCodeBlockAttributes(metastring = '') {
	const tokens = getMetaTokens(metastring);
	const attributes = [];

	if (tokens.includes('split')) attributes.push('split="on"');

	const showPreviewToken = tokens.find((token) => token.startsWith('show-preview='));
	const showPreview = showPreviewToken
		?.slice('show-preview='.length)
		.replace(/^['"]|['"]$/g, '');

	if (['on', 'off'].includes(showPreview)) {
		attributes.push(`show-preview="${showPreview}"`);
	}

	// const splitControlToken = tokens.find((token) => token.startsWith('split-control='));
	// const splitControl = splitControlToken
	// 	?.slice('split-control='.length)
	// 	.replace(/^['"]|['"]$/g, '');

	// if (['toggle', 'checkbox', 'off'].includes(splitControl)) {
	// 	attributes.push(`split-control="${splitControl}"`);
	// }

	// Manually setting split control to off for now
	attributes.push(`split-control="off"`);

	return attributes.length ? ` ${attributes.join(' ')}` : '';
}

// Keep Gruvbox's hue relationships, with darker light-theme inks and lighter
// dark-theme comments/keywords for our neutral code canvases (at least 4.5:1).
const codeInk = {
	light: {
		'#928374': '#74695d',
		'#b57614': '#946010',
		'#79740e': '#6f6a0d',
		'#7c6f64': '#71655b',
		'#427b58': '#3c7151',
	},
	dark: {
		'#928374': '#aa9b8b',
		'#fb4934': '#fc6f5e',
	},
};

async function codeTheme(mode) {
	const { default: theme } = await bundledThemes[`gruvbox-${mode}-hard`]();
	const foreground = (color) => codeInk[mode][color?.toLowerCase()] ?? color;
	return {
		...theme,
		name: `dynamowaves-${mode}`,
		tokenColors: theme.tokenColors.map((token) => ({
			...token,
			settings: { ...token.settings, foreground: foreground(token.settings.foreground) },
		})),
	};
}

/** @type {ReturnType<typeof createHighlighter> | undefined} */
let highlighterPromise;

function getHighlighter() {
	highlighterPromise ??= createHighlighter({
		langs: [...new Set(Object.values(languages))],
		themes: [codeTheme('light'), codeTheme('dark')],
	});

	return highlighterPromise;
}

/** @type {import('mdsvex').MdsvexOptions} */
const config = {
	extensions: ['.md'],
	highlight: {
		async highlighter(code, language = 'text', metastring = '') {
			const highlighter = await getHighlighter();
			const loadedLanguage = languages[language] ?? 'text';
			const highlightedCode = highlighter.codeToHtml(code, {
				lang: loadedLanguage,
				themes: {
					light: 'dynamowaves-light',
					dark: 'dynamowaves-dark',
				},
				defaultColor: false,
			});
			const tokens = getMetaTokens(metastring);
			// Let an authored zbk-code-block own the frame and preview slot while
			// this fence contributes only Shiki's semantic pre/code source tree.
			const isBare = tokens.includes('bare');
			const label = languageLabels[language] ?? 'Code';
			const codeBlockAttributes = getCodeBlockAttributes(metastring);
			const html = isBare
				? highlightedCode
				: `<zbk-code-block label="${label}"${codeBlockAttributes}>${highlightedCode}</zbk-code-block>`;

			return `{@html \`${escapeSvelte(html)}\`}`;
		},
	},
};

export default config;
