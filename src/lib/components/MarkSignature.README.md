# MarkSignature

The Mark Zebley signature mark, with the write-on entrance and hover/focus
animation used by the mz-svelte navigation.

    <script>
      import MarkSignature from './MarkSignature.svelte';
    </script>

    <a href="https://markzebley.com" aria-label="Mark Zebley — Home">
      <MarkSignature />
    </a>

Size the SVG from the consuming link. The component deliberately has no fixed
dimensions:

    a :global(svg) {
      inline-size: var(--zbk-spacing-2);
      block-size: var(--zbk-spacing-2);
    }

## Behavior

- The base brand layer writes on once after the page load, webfonts, and paint
  work settle.
- A second action-color layer writes on when the wrapping link or button is
  hovered or keyboard-focused, and reverses smoothly when that state ends.
- The rendered SVG has unique mask IDs per instance.
- No-JavaScript and reduced-motion modes render the complete mark immediately.

Setting animateIn to false skips the entrance. Override --sig-ink,
--sig-ink-action, and --sig-ink-action-active when the consumer places the mark
on a fixed surface whose color does not change with the app theme.

## Source

markSignature.paths.ts is copied from the generated mz-svelte source. Until this
component is extracted into a shared package, regenerate the centreline there
and update the component and paths together.
