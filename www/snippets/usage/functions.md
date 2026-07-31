---
slug: usage-functions
title: Functions
type: docs
group: usage
order: 3
groupOrder: 2
groupLabel: Usage
---

<h3 id="available-functions">Available Functions</h3>

**Dynamowaves** come with a few functions that can be called to manipulate the wave after it's been rendered.

<h4 id="generate-new-wave">.generateNewWave()</h4>

Want to see a new wave? Call **<code>generateNewWave(<em>duration</em>)</code>** on the **dynamowave** you'd like to regenerate. The **<code>duration</code>** parameter is an optional integer that determines how quickly the old wave morphs into the new wave - default is **800**(ms).

```javascript
const wave = document.querySelector('dynamo-wave');
wave.generateNewWave(500);
```

<dynamo-wave class="fill-theme" id="regen-example-wave"></dynamo-wave>

<zbk-button class="margin-block-start-1 margin-block-end-2" variant="wave-action wave-pop lg" onclick="regenHeader('regen-example-wave', 500)"><i slot="icon" data-position="start" data-feather="refresh-cw"></i>New Wave</zbk-button>

<h4 id="play">.play()</h4>

Call **<code>play(<em>duration</em>)</code>** on any **dynamowave** that you'd like to animate. The **<code>duration</code>** parameter is an optional integer that determines the length of the animation loop - default is **7500**(ms).


<h4 id="pause">.pause()</h4>

To stop the animation loop, call **<code>pause()</code>** on the **dynamowave** you'd like to stop.

```javascript
const wave = document.querySelector('dynamo-wave');

function toggleWaveAnimation() { 
  if (wave.isAnimating) {
    wave.pause();
  } else {
    wave.play(5000);
  }
}
```

<dynamo-wave class="fill-theme" id="play-example-wave"></dynamo-wave>

<zbk-button class="margin-block-start-1 margin-inline-end-05" variant="wave-action wave-pop lg" onclick="play('play-example-wave', 5000)"><i slot="icon" data-position="start" data-feather="play"></i>Play Wave</zbk-button>
<zbk-button class="margin-block-start-1" variant="wave-action wave-pop lg" onclick="pause('play-example-wave')"><i slot="icon" data-position="start" data-feather="pause"></i>Pause Wave</zbk-button>
