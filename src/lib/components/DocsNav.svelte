<script lang="ts">
  import { pushState } from "$app/navigation";
  import { whenPageSettled } from "$lib/pageSettled";
  import { onMount } from "svelte";

  type NavSection = {
    id: string;
    label: string;
  };

  let { sections }: { sections: readonly NavSection[] } = $props();
  let mobileToc: HTMLDetailsElement | undefined;
  let desktopRail: HTMLDivElement | undefined;
  let desktopNavSticky = $state(false);
  const legacyTargets: Readonly<Record<string, string>> = {
    "installation-header": "installationHeader",
    "usage-header": "usageHeader",
    "usage-functions": "javascript-api",
    "available-functions": "javascript-api",
    "generate-new-wave": "javascript-api",
    play: "javascript-api",
    pause: "javascript-api",
    "data-attributes": "api-reference",
    "points-and-variance": "attributes",
    "deterministic-waves": "seed-modes",
    "anchored-endpoints": "attributes",
    "wave-direction": "attributes",
    "wave-animation": "attributes",
    "wave-observation": "observation",
    examples: "practicalApplicationHeader",
  };

  const focusCleanups = new Set<() => void>();

  function focusTarget(target: HTMLElement) {
    if (!target.hasAttribute("tabindex")) {
      target.setAttribute("tabindex", "-1");
      const cleanup = () => {
        target.removeEventListener("blur", cleanup);
        target.removeAttribute("tabindex");
        focusCleanups.delete(cleanup);
      };
      focusCleanups.add(cleanup);
      target.addEventListener("blur", cleanup, { once: true });
    }
    target.focus({ preventScroll: true });
  }

  function focusSection(id: string, behavior: ScrollBehavior) {
    const target = document.getElementById(legacyTargets[id] ?? id);
    if (!target) return;
    target.scrollIntoView({ behavior, block: "start" });
    focusTarget(target);
  }

  function navigate(event: MouseEvent, id: string) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    pushState(`#${id}`, {});
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";
    focusSection(id, behavior);
    mobileToc?.removeAttribute("open");
  }

  function scrollToTop() {
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? "auto"
      : "smooth";
    const heading = document.getElementById("heading");

    window.scrollTo({ top: 0, behavior });

    if (heading) focusTarget(heading);
  }

  onMount(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    const lifecycle = new AbortController();
    let animationFrame = 0;

    if (id) {
      void whenPageSettled({ signal: lifecycle.signal }).then((ready) => {
        if (ready && !lifecycle.signal.aborted) focusSection(id, "auto");
      });
    }

    const updateStickyState = () => {
      animationFrame = 0;
      if (!desktopRail || getComputedStyle(desktopRail).display === "none") {
        desktopNavSticky = false;
        return;
      }

      const stickyInset = Number.parseFloat(
        getComputedStyle(desktopRail).insetBlockStart,
      );
      desktopNavSticky =
        Number.isFinite(stickyInset) &&
        Math.abs(desktopRail.getBoundingClientRect().top - stickyInset) <= 1;
    };

    const queueStickyStateUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateStickyState);
    };

    updateStickyState();
    window.addEventListener("scroll", queueStickyStateUpdate, {
      passive: true,
    });
    window.addEventListener("resize", queueStickyStateUpdate, {
      passive: true,
    });

    return () => {
      lifecycle.abort();
      for (const cleanup of focusCleanups) cleanup();
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", queueStickyStateUpdate);
      window.removeEventListener("resize", queueStickyStateUpdate);
    };
  });
</script>

<aside class="docs-nav" aria-label="Documentation navigation">
  <div bind:this={desktopRail} class="desktop-rail">
    <nav class="desktop-nav" aria-labelledby="desktop-toc-heading">
      <p id="desktop-toc-heading" class="toc-heading">Quick links</p>
      <ul class="prose">
        {#each sections as section}
          <li>
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <zbk-link
              href={`#${section.id}`}
              onclick={(event: MouseEvent) => navigate(event, section.id)}
            >
              {section.label}
            </zbk-link>
          </li>
        {/each}
        <li><hr class="prose display-flex margin-block-1 opacity-25" /></li>
        <li>
          <zbk-link
            href="https://github.com/mzebley/dynamowaves"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </zbk-link>
        </li>
        <li>
          <zbk-link
            href="https://www.npmjs.com/package/dynamowaves"
            target="_blank"
            rel="noopener"
          >
            npm
          </zbk-link>
        </li>
      </ul>
    </nav>

    <div
      class:visible={desktopNavSticky}
      class="back-to-top-slot"
      inert={!desktopNavSticky ? true : undefined}
    >
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <zbk-button
        variant="wave-action wave-pop lg"
        aria-label="Back to top"
        onclick={scrollToTop}
      >
        <span slot="icon" data-position="start" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style="transform:rotate(90deg)"><path d="M15.0712 4.92883L16.4854 6.34305L11.8286 10.9999L21.0004 11L21.0004 13L11.8286 12.9999L16.4854 17.6568L15.0712 19.071L8.00016 11.9999L15.0712 4.92883ZM4.00037 18.9998L4.00037 4.99985H6.00037L6.00037 18.9998H4.00037Z"></path></svg>
        </span>
        Back to top
      </zbk-button>
    </div>
  </div>

  <details bind:this={mobileToc} class="mobile-nav">
    <summary class="toc-heading">Quick links</summary>
    <nav aria-label="Quick links">
      <ul class="prose">
        {#each sections as section}
          <li>
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <zbk-link
              href={`#${section.id}`}
              onclick={(event: MouseEvent) => navigate(event, section.id)}
            >
              {section.label}
            </zbk-link>
          </li>
        {/each}
        <li><hr class="prose display-flex margin-block-1 opacity-25" /></li>
        <li>
          <zbk-link
            href="https://github.com/mzebley/dynamowaves"
            target="_blank"
            rel="noopener"
          >
            GitHub
          </zbk-link>
        </li>
        <li>
          <zbk-link
            href="https://www.npmjs.com/package/dynamowaves"
            target="_blank"
            rel="noopener"
          >
            npm
          </zbk-link>
        </li>
      </ul>
    </nav>
  </details>
</aside>

<style>
  .docs-nav {
    min-inline-size: 0;
  }

  .desktop-rail {
    --docs-nav-sticky-inset: var(--zbk-spacing-2);

    position: sticky;
    inset-block-start: var(--docs-nav-sticky-inset);
    display: flex;
    flex-direction: column;
    block-size: calc(100svh - (var(--docs-nav-sticky-inset) * 2));
  }

  .desktop-nav {
    padding-inline: var(--zbk-spacing-105);
    padding-block: var(--zbk-spacing-1) var(--zbk-spacing-105);
    border: var(--zbk-border-width-sm) solid var(--zbk-info-border-subtle);
    background: var(--zbk-info-canvas-subtle);
    border-radius: var(--zbk-border-radius-lg);
    box-shadow: var(--zbk-spacing-05) var(--zbk-spacing-05) 0 0
      var(--zbk-accent-primary-canvas-muted);
  }

  .back-to-top-slot {
    display: flex;
    justify-content: center;
    margin-block-start: auto;
    padding-block-start: var(--zbk-spacing-2);
    opacity: 0;
    visibility: hidden;
    transform: translateY(calc(100% + var(--docs-nav-sticky-inset)));
    transition:
      transform var(--zbk-transition-playful-motion-duration-default)
        var(--zbk-transition-playful-motion-function-default),
      opacity var(--zbk-transition-duration-default) ease,
      visibility 0s linear var(--zbk-transition-duration-default);
  }

  .back-to-top-slot.visible {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    transition-delay: 0s;
  }

  .back-to-top-slot svg {
    inline-size: var(--zbk-spacing-105);
    block-size: var(--zbk-spacing-105);
  }

  .toc-heading {
    color: var(--zbk-accent-primary-ink-emphasis);
    margin-block-end: var(--zbk-spacing-025);
    font-size: var(--zbk-font-size-lg);
    font-weight: var(--zbk-font-weight-medium);
    font-family: var(--zbk-font-family-heading);
  }

  .mobile-nav {
    display: none;
  }

  @media (max-width: 64rem) {
    .desktop-rail {
      display: none;
    }

    .toc-heading {
      line-height: var(--zbk-line-height-3);
      margin-block-end: 0px;
    }

    .mobile-nav {
      display: block;
      border: var(--zbk-border-width-sm) solid var(--zbk-info-border-subtle);
      background: var(--zbk-info-canvas-subtle);
      border-radius: var(--zbk-border-radius-lg);
      box-shadow: var(--zbk-spacing-05) var(--zbk-spacing-05) 0 0
        var(--zbk-accent-primary-canvas-muted);
    }

    summary {
      min-block-size: var(--zbk-a11y-min-interaction-size, 44px);
      padding: var(--zbk-spacing-05, 0.5rem) var(--zbk-spacing-1, 1rem);
      cursor: pointer;
    }

    .mobile-nav nav {
      padding: 0 var(--zbk-spacing-1, 1rem) var(--zbk-spacing-1, 1rem);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .back-to-top-slot {
      transition: none;
      transform: none;
    }
  }
</style>
