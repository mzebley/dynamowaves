---
slug: angular-installation
title: Angular
type: docs
group: installation
order: 3
groupOrder: 1
groupLabel: Installation
---

<h3 id="angular-installation">Angular Setup</h3>

To use **Dynamowaves** in an Angular project, follow these additional steps after installing via npm:

1. In your <code class="file-name">angular.json</code> file, add the <code class="file-name">dynamowaves</code> script to the <code class="file-name">scripts</code> array:

```json
"scripts": [
    "node_modules/dynamowaves/dist/dynamowaves.js"
  ]
```

2. In your <code class="file-name">app.module.ts</code> file, add <code class="file-name">CUSTOM_ELEMENTS_SCHEMA</code> to the <code class="file-name">schemas</code> array:

```typescript
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

  @NgModule({
  // ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
  })

  export class AppModule { }
```
