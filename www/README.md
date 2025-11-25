# Authoring docs with mark↓

The marketing site uses the **mark↓** toolchain to render documentation from Markdown files.  
Content is stored statically and compiled into final HTML before deployment.

## Content locations
- **Markdown snippets**: `www/snippets/`
- **Docs template page**: `www-src/index.html`
- **Compiled output**: `www/index.html`

## Writing snippets
1. Add `.md` files under `www/snippets/`.
2. Include front matter:

```markdown
---
slug: usage-intro
title: Usage intro
order: 2
---

<p class="lede">Markdown supports inline HTML.</p>
```

3. Write standard Markdown or HTML.

## How docs are built
Two phases:

1. **Manifest generation** → `www/snippets-index.json`  
2. **Page compilation** → consumes manifest + `www-src/index.html` → outputs `www/index.html`

## Commands

### Build once
- `npm run docs:manifest`
- `npm run docs:build`

### Watch while editing
- `npm run docs:watch`

Pairs well with:

```bash
npx serve www
```

## CDN client-side hydration (optional)

```html
<script type="module">
  import { SnippetClient } from "https://cdn.jsdelivr.net/npm/@mzebley/mark-down/+esm";
  const client = new SnippetClient({ manifest: "./snippets-index.json" });
  client.hydrate();
</script>
```

## Deployment
Commit:
- Markdown files  
- `www/snippets-index.json`  
- Compiled `www/index.html`

Everything in `www/` is static and production‑ready.
