---
slug: installation-header
title: Overview
type: docs
group: installation
order: 1
groupOrder: 1
groupLabel: Installation
---

<h2 id="installation-header">Installation</h2>

To make render times functionally instant, **Dynamowaves** intentionally eskews importing a library such as **SVG.js** to build a new SVG on execution.

Instead, it builds randomly seeded **```<paths>```** based on criteria you set,
and then leverages HTML web components (sorry, IE) to allow it to easily grab its reference element's applied attributes and then fully replace it with a slick lil' wave.

You can install **Dynamowaves** via npm, leveraging a CDN, or by including the script file directly in your project.
