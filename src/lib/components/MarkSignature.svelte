<script lang="ts">
  import { onMount } from "svelte";
  import { whenPageSettled } from "$lib/pageSettled";
  import { GLYPH_D, STROKE_D, STROKE_WIDTH } from "./markSignature.paths";

  interface Props {
    /** Write the mark on once, after the page settles. */
    animateIn?: boolean;
    class?: string;
  }

  let { animateIn = true, class: className = "" }: Props = $props();

  // Masks are referenced by id, so every instance needs its own set.
  const uid = $props.id();

  let baseNib = $state<SVGUseElement | undefined>();

  // The write-on is a real CSS animation parked behind a long fallback delay, so
  // a page that never runs this still ends up with a drawn mark. Once the page
  // has actually stopped loading and painting, pull it forward to now — a fixed
  // delay can only guess, and guessing wrong lands the draw in the middle of
  // load work, where dropped frames read as the animation stuttering.
  onMount(() => {
    if (!animateIn) return;
    const lifecycle = new AbortController();

    whenPageSettled({ signal: lifecycle.signal }).then((ready) => {
      if (!ready || lifecycle.signal.aborted) return;
      const anim = baseNib?.getAnimations()[0];
      if (!anim?.effect) return;
      const delay = Number(anim.effect.getTiming().delay ?? 0);
      // Already away on the fallback: restarting now would look like a replay.
      if (Number(anim.currentTime ?? 0) > delay) return;
      anim.effect.updateTiming({ delay: 0 });
      anim.currentTime = 0;
      anim.play();
    });

    return () => {
      lifecycle.abort();
    };
  });
</script>

<!--
  Two stacked copies of the same outline, each revealed by its own mask. The
  mask is the signature's centreline, stroked wide enough to cover the outline,
  with a dash the length of the whole path — sliding its offset writes the mark
  on in pen order.

  The base copy writes itself in on load. The action copy sits on top and writes
  in on hover, so the brand colour stays put underneath and the action colour
  runs over it. Its reveal is a *transition*, not an animation, so leaving mid
  draw reverses from wherever the nib currently sits.
-->
<svg
  class="sig {className}"
  class:sig--animate={animateIn}
  style="--sig-nib-width: {STROKE_WIDTH}"
  viewBox="0 0 425 425"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <path id="{uid}-glyph" d={GLYPH_D} />
    <path id="{uid}-stroke" d={STROKE_D} pathLength="1" />

    <mask
      id="{uid}-base"
      maskUnits="userSpaceOnUse"
      x="-24"
      y="-24"
      width="473"
      height="473"
    >
      <use
        bind:this={baseNib}
        class="sig-nib sig-nib--base"
        href="#{uid}-stroke"
      />
    </mask>
    <mask
      id="{uid}-action"
      maskUnits="userSpaceOnUse"
      x="-24"
      y="-24"
      width="473"
      height="473"
    >
      <use class="sig-nib sig-nib--action" href="#{uid}-stroke" />
    </mask>
  </defs>

  <use class="sig-ink sig-ink--base" href="#{uid}-glyph" mask="url(#{uid}-base)" />
  <use
    class="sig-ink sig-ink--action"
    href="#{uid}-glyph"
    mask="url(#{uid}-action)"
  />
</svg>

<style lang="css">
  /* Registered so it interpolates as a number — an unregistered custom property
     would jump rather than sweep. */
  @property --sig-draw {
    syntax: "<number>";
    inherits: false;
    initial-value: 0;
  }

  .sig {
    /* Durations ride the a11y motion modifier, which the tokens drop to 0 under
       prefers-reduced-motion — so both reveals land instantly there. */
    --sig-write-duration: calc(
      2200ms * var(--zbk-a11y-transition-duration-modifier, 1)
    );
    /* Not the intended start — the script pulls the animation forward the moment
       the page settles. This is the backstop for when that never happens, and is
       deliberately later than whenPageSettled's own cap so the script wins. */
    --sig-write-fallback-delay: calc(
      5000ms * var(--zbk-a11y-transition-duration-modifier, 1)
    );
    --sig-hover-duration: calc(
      1000ms * var(--zbk-a11y-transition-duration-modifier, 1)
    );
    /* Near-constant nib speed: a normal ease-out spends its last tenth at ~0.06x
       speed, which reads as the mark stalling rather than a pen finishing. This
       holds ~0.66x at both ends. Deliberately not a playful token either — those
       overshoot past 1, driving the dash offset negative and blinking the tail. */
    --sig-ease: cubic-bezier(0.3, 0.15, 0.7, 0.85);

    display: block;
  }

  .sig-nib {
    fill: none;
    stroke: #fff;
    stroke-width: var(--sig-nib-width);
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1 1;
    /* Clamped so any easing that overshoots still can't wrap the dash pattern. */
    stroke-dashoffset: clamp(0, calc(1 - var(--sig-draw)), 1);
  }

  /* Fully drawn by default: with no JS and no animation the mark still shows. */
  .sig-nib--base {
    --sig-draw: 1;
  }

  .sig--animate .sig-nib--base {
    animation: sig-write var(--sig-write-duration) var(--sig-ease)
      var(--sig-write-fallback-delay) both;
  }

  /* Nothing is coming to start it, so don't hold the mark back at all. */
  @media (scripting: none) {
    .sig--animate .sig-nib--base {
      animation: none;
      --sig-draw: 1;
    }
  }

  @keyframes sig-write {
    from {
      --sig-draw: 0;
    }
    to {
      --sig-draw: 1;
    }
  }

  .sig-nib--action {
    --sig-draw: 0;
    transition: --sig-draw var(--sig-hover-duration) var(--sig-ease);
  }

  /* Driven by whichever control wraps the mark, so the component carries its own
     hover behaviour instead of making every consumer re-wire it. */
  :global(a:hover) .sig-nib--action,
  :global(a:focus-visible) .sig-nib--action,
  :global(button:hover) .sig-nib--action,
  :global(button:focus-visible) .sig-nib--action {
    --sig-draw: 1;
  }

  .sig-ink--base {
    fill: var(--sig-ink, var(--zbk-brand-ink));
  }

  .sig-ink--action {
    fill: var(--sig-ink-action, var(--zbk-action-ink));
  }

  :global(a:active) .sig-ink--action,
  :global(button:active) .sig-ink--action {
    fill: var(--sig-ink-action-active, var(--zbk-action-ink-emphasis));
  }

  /* The token modifier already zeroes the durations here; this also covers the
     case where the modifier isn't in scope. */
  @media (prefers-reduced-motion: reduce) {
    .sig--animate .sig-nib--base {
      animation: none;
      --sig-draw: 1;
    }

    .sig-nib--action {
      transition: none;
    }
  }
</style>
