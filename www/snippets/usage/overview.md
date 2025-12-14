---
slug: usage-header
title: Overview
type: docs
group: usage
order: 1
groupOrder: 2
groupLabel: Usage
---

<h2 id="usage-header">Usage</h2>

Since **Dynamowaves** use HTML templating syntax, all it takes to call one is to add the custom element to your HTML!

```html
<!-- Without any added attributes you get a top facing wave filled with the current color of its parent --> 
<dynamo-wave></dynamo-wave>
```

<dynamo-wave class="fill-ink" style="margin-bottom:1.25rem"></dynamo-wave>

A **dynamo-wave** will inherit any **<code>class</code>**, **<code>id</code>**, or **<code>style</code>** applied to its invoking element.

```html
<!-- Example 1 -->
<dynamo-wave style="fill:slateblue"></dynamo-wave>
```

<dynamo-wave style="fill:slateblue"></dynamo-wave>

```html
<style>
    .fill-theme {
        fill: var(--theme);
    }
</style>

<!-- Example 2 -->
<dynamo-wave class="fill-theme"></dynamo-wave>
```

<dynamo-wave class="fill-theme"></dynamo-wave>

```html
<style>
    #special_wave {
        height: 3rem;
        width:80%;
        transform: translateX(10%);
    }
</style>

<!-- Example 3 -->
<dynamo-wave id="special_wave" class="fill-theme fill-light"></dynamo-wave>
```

<dynamo-wave id="special_wave" class="fill-theme fill-light"></dynamo-wave>
