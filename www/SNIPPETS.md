# Authoring snippets with mark↓

The marketing site (`www/`) now loads its copy from Markdown using the `@mzebley/mark-down` toolchain. Keep everything static-site friendly:

- Markdown lives next to the site under `www/snippets/`.
- The generated manifest is `www/snippets-index.json` so it can be downloaded by GitHub Pages/Netlify.
- The docs page hydrates elements that declare `data-snippet="slug"` by fetching HTML through the mark↓ runtime bundle served from jsDelivr.

## Writing snippets

1. Create a new `.md` file inside `www/snippets/`.
2. Add YAML front matter. `slug` is required and must match the `data-snippet` attribute you plan to hydrate.

```markdown
---
slug: usage-intro
title: Usage intro
type: docs
order: 2
---

<p class="lede">Markdown content supports HTML. Add whatever markup you want rendered in the docs.</p>
```

3. Author Markdown/HTML as usual. Code fences become highlighted automatically after hydration, so structuring fenced blocks (` ```html `) is encouraged.

## Building & watching

Use the provided npm scripts from the repo root:

- `npm run snippets:build` – runs `mark-down build www/snippets --output www/snippets-index.json`. Always run this before committing or publishing so the manifest stays in sync with your Markdown.
- `npm run snippets:watch` – same as build but with file watching. Keep it running while editing snippets locally.

The commands rely on the dev dependency `@mzebley/mark-down-cli`, so `npm install` once after cloning.

## Rendering on the site

`www/index.html` looks for elements with `data-snippet="<slug>"` and swaps their contents with the rendered snippet:

```html
<div data-snippet="hero-intro"></div>
```

The browser bundle is loaded via:

```html
<script type="module">
  import { SnippetClient } from "https://cdn.jsdelivr.net/npm/@mzebley/mark-down/+esm";
  const client = new SnippetClient({ manifest: "./snippets-index.json" });
  // …hydrate elements…
</script>
```

`SnippetClient` automatically sanitizes Markdown and reruns Highlight.js once snippets finish loading.

## Deployment tips

- Commit both your `.md` files and the generated `www/snippets-index.json` so static hosting platforms can serve everything.
- Because everything sits under `www/`, no extra build step is required beyond `npm run snippets:build`.
- Keep snippet HTML self-contained. Styles can reference existing classes or inline styles, just like traditional content blocks.
