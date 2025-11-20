---
slug: data-attributes
title: Data Attributes
type: docs
group: usage
order: 2
groupOrder: 2
groupLabel: Usage
---

<h3 id="data-attributes">Data Attributes</h3>

**Dynamowaves** come out of the box with a variety of data attributes that can be used to customize their appearance and behavior.

<h4 id="points-and-variance">Points and Variance</h4>

A **dynamowave** will generate itself a new, randomized wave path each time it's rendered. This wave path is calculated using **<code>points</code>**, which determine the number of points that make up the wave path, and **<code>variance</code>** - the maximum amount each point can deviate from the wave's center.

<div class="table-container" tabindex="0">
    <table aria-label="Wave point and variance attribute configuration table">
    <thead>
        <tr>
        <th scope="col">Attribute</th>
        <th scope="col">Default</th>
        <th scope="col">Options</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>
            <p style="min-width: max-content;">data-wave-points</p>
        </td>
        <td>6</td>
        <td>Any positive integer</td>
        </tr>
        <tr>
        <td>
            <p>data-wave-variance</p>
        </td>
        <td>3</td>
        <td>Any positive integer</td>
        </tr>
    </tbody>
    </table>
</div>

```html
<!-- Update the points and variance to change up your wave feel -->
<dynamo-wave data-wave-points="100" data-wave-variance="2"></dynamo-wave>
```

<p class="note">
<strong>Legacy support:</strong> Existing markup that uses  <code>data-variance</code> will continue to work, but <code>data-wave-variance</code> is the preferred attribute for clarity going forward.
</p>

<dynamo-wave style="margin-bottom:1.25rem" data-wave-points="120" data-wave-variance="2"></dynamo-wave>

<h4 id="deterministic-waves">Deterministic waves</h4>

Every generated wave encodes its exact SVG path into ```data-wave-seed```. Copy that attribute to reuse the same shape anywhere:

```html
<dynamo-wave id="hero-wave" data-wave-animate="true"></dynamo-wave>

<script>
  const heroSeed = document.getElementById('hero-wave')?.getAttribute('data-wave-seed');

  if (heroSeed) {
    const footerWave = document.createElement('dynamo-wave');
    footerWave.setAttribute('data-wave-seed', heroSeed);
    document.body.appendChild(footerWave);
  }
</script>
```

The value is a compact, URL-safe string representation of the full path; if it is present on an element, the component renders that exact path instead of generating a new one.

<dynamo-wave data-wave-seed="TSAwIDE2MCBMIDAgNjguOTEzMzA4MTQ1MzQwODkgUSAwIDY4LjkxMzMwODE0NTM0MDg5LCAxNDQgOTQuOTQ3OTQzOTk4MjM1NjIgUSAyODggMTIwLjk4MjU3OTg1MTEzMDM1LCA0MzIgOTEuNTIyNzY5ODgxMDQ1MjQgUSA1NzYgNjIuMDYyOTU5OTEwOTYwMTMsIDcyMCA3MS4yNTU1NDIxOTY5NDc3NyBRIDg2NCA4MC40NDgxMjQ0ODI5MzU0MSwgMTAwOCAxMDEuODI4ODg1NjkwNTM3MTYgUSAxMTUyIDEyMy4yMDk2NDY4OTgxMzg5LCAxMjk2IDc5LjY4Nzg5MjUwODMyOTkgUSAxNDQwIDM2LjE2NjEzODExODUyMDg4LCAxNDQwIDM2LjE2NjEzODExODUyMDg4IEwgMTQ0MCAxNjAgWg"></dynamo-wave>

<dynamo-wave data-wave-seed="TSAwIDE2MCBMIDAgNjguOTEzMzA4MTQ1MzQwODkgUSAwIDY4LjkxMzMwODE0NTM0MDg5LCAxNDQgOTQuOTQ3OTQzOTk4MjM1NjIgUSAyODggMTIwLjk4MjU3OTg1MTEzMDM1LCA0MzIgOTEuNTIyNzY5ODgxMDQ1MjQgUSA1NzYgNjIuMDYyOTU5OTEwOTYwMTMsIDcyMCA3MS4yNTU1NDIxOTY5NDc3NyBRIDg2NCA4MC40NDgxMjQ0ODI5MzU0MSwgMTAwOCAxMDEuODI4ODg1NjkwNTM3MTYgUSAxMTUyIDEyMy4yMDk2NDY4OTgxMzg5LCAxMjk2IDc5LjY4Nzg5MjUwODMyOTkgUSAxNDQwIDM2LjE2NjEzODExODUyMDg4LCAxNDQwIDM2LjE2NjEzODExODUyMDg4IEwgMTQ0MCAxNjAgWg" style="margin-bottom:1.25rem"></dynamo-wave>

<h4 id="anchored-endpoints">Anchored endpoints</h4>

When you need the wave to begin and end on the baseline&mdash;perfect for pinned backgrounds or matching solid color blocks&mdash;set **`data-start-end-zero`**. The attribute accepts boolean-like values such as `"true"`, `"1"`, or you can include it without a value. It works for both horizontal and vertical waves.

```html
<!-- Empty attribute keeps the first and last points at height 0 -->
<dynamo-wave data-start-end-zero></dynamo-wave>

<!-- Explicit true value works as well -->
<dynamo-wave data-wave-face="left" data-start-end-zero="true"></dynamo-wave>
```

<dynamo-wave class="fill-theme" data-start-end-zero style="height:5rem; margin-bottom:1.125rem"></dynamo-wave>

<h4 id="wave-direction">Wave Direction</h4>

Need more than a just a wave that faces up? Leverage the **<code>data-wave-face</code>** attribute.

<div class="table-container" tabindex="0">
    <table aria-label="Wave direction attribute configuration table">
    <thead>
        <tr>
        <th scope="col">Attribute</th>
        <th scope="col">Default</th>
        <th scope="col">Options</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>
            <p>data-wave-face</p>
        </td>
        <td>'top'</td>
        <td>'top', 'bottom', 'left', 'right'</td>
        </tr>
    </tbody>
    </table>
</div>

```html
<!-- Bottom facing wave -->
<dynamo-wave class="fill-theme" data-wave-face="bottom"></dynamo-wave>
```

<dynamo-wave class="fill-theme" data-wave-face="bottom" style="margin-bottom: 1.25rem;"></dynamo-wave>

<h4 id="wave-animation">Wave Animation</h4>

Want a **dynamowave** that you can just sit around and stare at? You might be interested in the **```data-wave-speed```** and **```data-wave-animate```** attributes.

<div class="table-container" tabindex="0">
    <table aria-label="Wave animation attribute configuration table">
    <thead>
        <tr>
        <th scope="col">Attribute</th>
        <th scope="col">Default</th>
        <th scope="col">Options</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>
            <p>data-wave-speed</p>
        </td>
        <td>7500</td>
        <td>Duration in milliseconds</td>
        </tr>
        <tr>
        <td>
            <p>data-wave-animate</p>
        </td>
        <td>false</td>
        <td>true, false</td>
        </tr>
    </tbody>
    </table>
</div>
<div class="note">
<p><strong>Accessibility Note:</strong> The <strong>data-wave-animate</strong> attribute will be ignored if the viewer's browser has <strong>reduced motion</strong> enabled.</p>
</div>

```html
<!-- Animated wave -->
<dynamo-wave class="fill-theme" data-wave-speed="5000" data-wave-animate="true"></dynamo-wave>
```

<dynamo-wave class="fill-theme" data-wave-speed="5000" data-wave-animate="true"></dynamo-wave>
            
<p class="note"><strong>Need to know when a loop finishes?</strong> Listen for the <code>dynamo-wave-complete</code> event to react when an animation cycle ends.</p>

```javascript
document.querySelector('dynamo-wave')
  .addEventListener('dynamo-wave-complete', (event) => {
    console.log('Wave finished animating', event.detail);
  });
```

<h4 id="wave-observation">Wave Observation</h4>

Looking to <em>really</em> lean into generative design? The **```data-wave-observe```** attribute adds an intelligent <a class="link" rel="external" target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API">IntersectionObserver</a> to your **dynamowave**, enabling dynamic wave regeneration.

<div class="table-container" tabindex="0">
    <table aria-label="Wave observation attribute configuration table">
    <thead>
        <tr>
        <th scope="col">Attribute</th>
        <th scope="col">Default</th>
        <th scope="col">Options</th>
        </tr>
    </thead>
    <tbody>
        <tr>
        <td>
            <p>data-wave-observe</p>
        </td>
        <td>unset</td>
        <td>
            <ul>
            <li><strong><code>once</code></strong> Generates a wave when leaving viewport, then stops</li>
            <li><strong><code>repeat</code></strong> Continuously regenerates waves when leaving viewport
            </li>
            <li><strong><code>once:300px</code></strong> Adds custom root margin</li>
            <li><strong><code>repeat:100px</code></strong> Combines mode with custom margin</li>
            </ul>
        </td>
        </tr>
    </tbody>
    </table>
</div>

<div class="note">
<p><strong>Margin Configuration:</strong> The optional pixel value after a colon adjusts the viewport intersection threshold. Use positive margins to start regeneration earlier, or negative margins to delay wave regeneration until the element is further from the viewport. </p>
</div>

```html
<!-- One-time wave regeneration -->
<dynamo-wave class="fill-theme" data-wave-observe="once"></dynamo-wave>

<!-- Continuous wave regeneration -->
<dynamo-wave class="fill-theme" data-wave-observe="repeat"></dynamo-wave>

<!-- Wave regenerates with 100px expanded viewport -->
<dynamo-wave class="fill-theme" data-wave-observe="repeat:100px"></dynamo-wave>

<!-- Wave regenerates with 50px contracted viewport -->
<dynamo-wave class="fill-theme" data-wave-observe="once:-50px"></dynamo-wave>
```
<dynamo-wave class="fill-theme" data-wave-observe="once"></dynamo-wave>
<dynamo-wave class="fill-theme" data-wave-observe="repeat"></dynamo-wave>
<dynamo-wave class="fill-theme" data-wave-observe="repeat:100px"></dynamo-wave>
<dynamo-wave class="fill-theme" data-wave-observe="once:-50px"></dynamo-wave>
