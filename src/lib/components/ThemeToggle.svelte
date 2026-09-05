<script lang="ts">
  import { onMount } from "svelte";

  const storageKey = "dynamowaves-theme";
  let dark = $state(false);
  let toggle:
    | (HTMLElement & { checked?: boolean; updateComplete?: Promise<unknown> })
    | undefined;

  function applyTheme(theme: "light" | "dark", source: "manual" | "system") {
    const root = document.documentElement;
    root.dataset.zbkTheme = theme;
    root.dataset.themeSource = source;
    dark = theme === "dark";

    if (toggle) {
      toggle.checked = dark;
    }
  }

  function storeTheme(theme: "light" | "dark") {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {
      // The selected theme still applies for this page when storage is unavailable.
    }
  }

  function handleChange(event: Event) {
    const control = event.currentTarget as HTMLElement & { checked?: boolean };
    const theme = control.checked ? "dark" : "light";
    applyTheme(theme, "manual");
    storeTheme(theme);
  }

  onMount(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const initialTheme = root.dataset.zbkTheme === "dark" ? "dark" : "light";
    applyTheme(
      initialTheme,
      root.dataset.themeSource === "manual" ? "manual" : "system",
    );

    const handleSystemTheme = (event: MediaQueryListEvent) => {
      if (root.dataset.themeSource !== "manual") {
        applyTheme(event.matches ? "dark" : "light", "system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemTheme);
    return () => mediaQuery.removeEventListener("change", handleSystemTheme);
  });
</script>

<zbk-toggle
  bind:this={toggle}
  data-theme-toggle
  checked={dark}
  aria-label="Dark theme"
  onchange={handleChange}
>
  Dark mode
</zbk-toggle>
