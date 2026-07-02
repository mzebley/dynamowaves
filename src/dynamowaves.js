// Allow the module to be imported in non-DOM environments (SSR, tests):
// only the custom element registration below requires a real DOM.
const BaseElement = typeof HTMLElement !== "undefined" ? HTMLElement : class {};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Declared ahead of the class body (and customElements.define below) because
// a <dynamo-wave> already present in the DOM is upgraded synchronously on
// define(), which can call connectedCallback -> parsePath before a
// const declared later in the file would be initialized (TDZ).
const WAVE_NUMBER_PATTERN = "[+-]?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?";
const QUAD_SEGMENT_REGEX = new RegExp(
  `Q\\s(${WAVE_NUMBER_PATTERN})\\s(${WAVE_NUMBER_PATTERN}),\\s(${WAVE_NUMBER_PATTERN})\\s(${WAVE_NUMBER_PATTERN})`,
  "g"
);

class DynamoWave extends BaseElement {
  static get observedAttributes() {
    return [
      "data-wave-face",
      "data-wave-points",
      "data-wave-variance",
      "data-variance",
      "data-wave-speed",
      "data-wave-animate",
      "data-wave-observe",
      "data-wave-seed",
      "data-start-end-zero",
    ];
  }

  /**
   * Constructs a new instance of the class.
   * 
   * @constructor
   * 
   * @property {boolean} isAnimating - Indicates whether the animation is currently running.
   * @property {number|null} animationFrameId - The ID of the current animation frame request.
   * @property {number} elapsedTime - The elapsed time since the animation started.
   * @property {number|null} startTime - The start time of the animation.
   * 
   * @property {boolean} isGeneratingWave - Indicates whether a wave is currently being generated.
   * 
   * @property {Path2D|null} currentPath - The current wave path.
   * @property {Path2D|null} targetPath - The target wave path.
   * @property {Path2D|null} pendingTargetPath - The next wave path to be generated.
   * 
   * @property {IntersectionObserver|null} intersectionObserver - The Intersection Observer instance.
   * @property {Object|null} observerOptions - The options for the Intersection Observer.
   */

  constructor() {
    super();
    this.isAnimating = false;
    this.animationFrameId = null;
    this.elapsedTime = 0;
    this.startTime = null;

    this.isGeneratingWave = false;

    // Track current and target wave paths
    this.currentPath = null;
    this.targetPath = null;
    this.pendingTargetPath = null; // New property to track the next wave

    // Intersection Observer properties
    this.intersectionObserver = null;
    this.observerOptions = null;

    this.random = Math.random;
    this.startEndZero = false;

    // Set when an animating element is detached so connectedCallback can
    // restart the loop if the element is re-attached.
    this.resumeOnConnect = false;

    // True while the component writes data-wave-seed itself, so
    // attributeChangedCallback can tell self-reflection from user changes.
    this.reflectingSeed = false;

    this.play = this.play.bind(this);
    this.pause = this.pause.bind(this);
    this.generateNewWave = this.generateNewWave.bind(this);
  }

  /**
   * Called when the custom element is appended to the DOM.
   * Initializes the wave properties, constructs the SVG element,
   * and sets up animation and observation if specified.
   * 
   * @method connectedCallback
   * @returns {void}
   */
  connectedCallback() {
    // Suffix the host id so the inner SVG never duplicates it in the document.
    const hostId = this.id || `dynamo-wave-${Math.random().toString(36).slice(2, 9)}`;
    const svgId = `${hostId}-svg`;

    const waveDirection = this.getAttribute("data-wave-face") || "top";
    const pointsAttr = parseInt(this.getAttribute("data-wave-points"), 10);
    this.points = Number.isFinite(pointsAttr) ? Math.max(2, pointsAttr) : 6;

    const varianceAttr = this.getAttribute("data-wave-variance");
    const legacyVarianceAttr = this.getAttribute("data-variance");
    const parsedVariance = parseFloat(varianceAttr ?? legacyVarianceAttr ?? "");
    this.variance = Number.isFinite(parsedVariance) ? parsedVariance : 3;
    const speedAttr = parseFloat(this.getAttribute("data-wave-speed"));
    this.duration = Number.isFinite(speedAttr) && speedAttr > 0 ? speedAttr : 7500;

    const seedAttr = this.getAttribute("data-wave-seed");
    const decodedSeedPath = decodeWaveSeed(seedAttr);
    const hasSeedAttr = typeof seedAttr === "string" && seedAttr.trim() !== "";

    this.random = hasSeedAttr && !decodedSeedPath
      ? createSeededRandom(seedAttr)
      : Math.random;

    const startEndZeroAttr = this.getAttribute("data-start-end-zero");
    this.startEndZero =
      typeof startEndZeroAttr === "string" &&
      ["", "true", "1", "yes", "on"].includes(startEndZeroAttr.trim().toLowerCase());

    this.vertical = waveDirection === "left" || waveDirection === "right";
    const flipX = waveDirection === "right";
    const flipY = waveDirection === "bottom";

    this.width = this.vertical ? 160 : 1440;
    this.height = this.vertical ? 1440 : 160;

    // Initialize current and target paths
    this.currentPath = decodedSeedPath || generateWave({
      width: this.width,
      height: this.height,
      points: this.points,
      variance: this.variance,
      vertical: this.vertical,
      random: this.random,
      startEndZero: this.startEndZero,
    });

    this.updateSeedAttribute(this.currentPath);

    this.targetPath = generateWave({
      width: this.width,
      height: this.height,
      points: this.points,
      variance: this.variance,
      vertical: this.vertical,
      random: this.random,
      startEndZero: this.startEndZero,
    });

    const transforms = [];

    if (flipX) transforms.push("scaleX(-1)");
    if (flipY) transforms.push("scaleY(-1)");

    const transformStyle = transforms.length ? `transform:${transforms.join(" ")};` : "";
    const svgBaseStyle = "width:100%;height:100%;display:block;";

    // Ensure the host element can size and space the SVG once
    const computedDisplay =
      typeof window !== "undefined" && typeof window.getComputedStyle === "function"
        ? window.getComputedStyle(this)?.display
        : "";

    if (!this.style.display && computedDisplay === "inline") {
      this.style.display = "block";
    }

    // Construct the SVG
    this.innerHTML = `
      <svg
        viewBox="${this.vertical ? "0 0 160 1440" : "0 0 1440 160"}"
        preserveAspectRatio="none"
        style="${transformStyle}${svgBaseStyle}"
        id="${svgId}"
        aria-hidden="true"
        role="presentation"
      >
        <path d="${this.currentPath}" style="stroke:inherit; fill: inherit"></path>
      </svg>
    `;

    // Save SVG references
    this.svg = this.querySelector("svg");
    this.path = this.querySelector("path");

    // Check for wave observation attribute
    const observeAttr = this.getAttribute("data-wave-observe");
    if (observeAttr) {
      this.setupIntersectionObserver(observeAttr);
    }

    // Automatically start animation if enabled, or resume a loop that was
    // running when the element was detached (e.g. moved within the DOM).
    const shouldAnimate =
      this.getAttribute("data-wave-animate") === "true" || this.resumeOnConnect;
    this.resumeOnConnect = false;

    if (shouldAnimate && !prefersReducedMotion()) {
      this.play();
    }
  }

  /**
   * Reacts to observed attribute changes after the initial render.
   * Cheap changes (speed, animate, observe) are applied in place; geometry
   * changes (points, variance, face, start-end-zero, seed) re-render the wave.
   */
  attributeChangedCallback(name, oldValue, newValue) {
    // Ignore changes before the first render (fires ahead of
    // connectedCallback for initial attributes) and while detached.
    if (!this.svg || !this.isConnected) return;
    if (oldValue === newValue) return;
    if (this.reflectingSeed) return;

    switch (name) {
      case "data-wave-speed": {
        const parsed = parseFloat(newValue);
        this.duration = Number.isFinite(parsed) && parsed > 0 ? parsed : 7500;

        if (this.isAnimating) {
          // Restart so the loop picks up the new duration, tweening onward
          // from the shape currently on screen instead of jumping back.
          this.pause();
          this.elapsedTime = 0;
          const displayedPath = this.path && this.path.getAttribute("d");
          if (displayedPath) {
            this.currentPath = displayedPath;
          }
          this.play();
        }
        break;
      }

      case "data-wave-animate": {
        if (newValue === "true") {
          if (!prefersReducedMotion()) this.play();
        } else {
          this.pause();
        }
        break;
      }

      case "data-wave-observe": {
        if (this.intersectionObserver) {
          this.intersectionObserver.disconnect();
          this.intersectionObserver = null;
        }
        if (newValue) {
          this.setupIntersectionObserver(newValue);
        }
        break;
      }

      case "data-wave-seed": {
        this.reinitialize();
        break;
      }

      default: {
        // Geometry attributes invalidate a recorded path snapshot in
        // data-wave-seed (the shape no longer matches the new settings);
        // PRNG seed strings still apply and are kept.
        const seedAttr = this.getAttribute("data-wave-seed");
        if (seedAttr && decodeWaveSeed(seedAttr)) {
          this.reflectingSeed = true;
          this.removeAttribute("data-wave-seed");
          this.reflectingSeed = false;
        }
        this.reinitialize();
      }
    }
  }

  /**
   * Tears down animation and observer state, then re-runs the initial render.
   * A loop that was running resumes against the new configuration.
   */
  reinitialize() {
    this.resumeOnConnect = this.isAnimating;

    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isAnimating = false;
    this.isGeneratingWave = false;
    this.elapsedTime = 0;
    this.startTime = null;
    this.pendingTargetPath = null;

    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    this.connectedCallback();
  }

  // Public method to play the animation
  /**
   * Starts the wave animation. If a custom duration is provided, it will be used for the animation;
   * otherwise, the instance's default duration will be used. The animation will continue looping
   * until `stop` is called.
   *
   * @param {number|null} [customDuration=null] - Optional custom duration for the animation in milliseconds.
   */
  play(customDuration = null) {
    // A morph from generateNewWave shares the animation state (startTime,
    // elapsedTime, animationFrameId); starting the loop mid-morph would run
    // two competing frame loops. Callers can retry on dynamo-wave-complete.
    if (this.isAnimating || this.isGeneratingWave || this.animationFrameId) return;
    this.isAnimating = true;

    // Use custom duration if provided, otherwise use the instance duration
    const animationDuration =
      Number.isFinite(customDuration) && customDuration > 0
        ? customDuration
        : this.duration;

    const continueAnimation = () => {
      // If there's no pending target path, generate a new one
      if (!this.pendingTargetPath) {
        this.pendingTargetPath = generateWave({
          width: this.width,
          height: this.height,
          points: this.points,
          variance: this.variance,
          vertical: this.vertical,
          random: this.random,
          startEndZero: this.startEndZero,
        });
      }

      // Animate to the pending target path
      this.animateWave(animationDuration, () => {
        // Update current path to the target path
        this.currentPath = this.targetPath;

        this.updateSeedAttribute(this.currentPath);

        // Set the pending path as the new target
        this.targetPath = this.pendingTargetPath;

        // Clear the pending path and generate a new one for the next iteration
        this.pendingTargetPath = generateWave({
          width: this.width,
          height: this.height,
          points: this.points,
          variance: this.variance,
          vertical: this.vertical,
          random: this.random,
          startEndZero: this.startEndZero,
        });

        // Continue the animation loop if still playing
        if (this.isAnimating) {
          continueAnimation();
        }
      });
    };

    // Start the continuous animation
    continueAnimation();
  }

  // Public method to pause the animation
  /**
   * Pauses the animation if it is currently running.
   * Sets the `isAnimating` flag to false, cancels the animation frame,
   * and saves the current elapsed time.
   */
  pause() {
    if (!this.isAnimating && this.animationFrameId == null) return;
    this.isAnimating = false;

    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.isGeneratingWave) {
      // A cancelled morph is not resumable; clear its timeline so the next
      // play()/generateNewWave() starts fresh from the displayed shape.
      this.isGeneratingWave = false;
      this.elapsedTime = 0;
    } else {
      // Save the current elapsed time so play() can resume mid-tween
      this.elapsedTime += performance.now() - (this.startTime || performance.now());
    }
    this.startTime = null;
  }

  /**
   * Called when the element is disconnected from the document's DOM.
   * Cleans up the intersection observer if it exists.
   */
  disconnectedCallback() {
    // Stop any running loop or morph so detached elements don't keep
    // animating; connectedCallback restarts the loop if re-attached.
    this.resumeOnConnect = this.isAnimating;

    if (this.animationFrameId != null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.isAnimating = false;
    this.isGeneratingWave = false;
    this.elapsedTime = 0;
    this.startTime = null;

    // Clean up intersection observer when element is removed
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  /**
   * Sets up an IntersectionObserver to monitor the visibility of the element.
   * 
   * @param {string} observeConfig - Configuration string for observation. 
   *                                 Format: "mode:rootMargin". 
   *                                 "mode" can be "once" for one-time observation.
   *                                 "rootMargin" is an optional margin around the root.
   * 
   * @example
   * // Observe with default root margin and trigger only once
   * setupIntersectionObserver('once:0px');
   * 
   * @example
   * // Observe with custom root margin and continuous triggering
   * setupIntersectionObserver('continuous:10px');
   */
  setupIntersectionObserver(observeConfig) {
    // Parse observation configuration
    const [mode, rootMargin = '0px'] = observeConfig.split(':');
    
    // Determine observation mode
    const isOneTime = mode === 'once';

    // Default options if not specified
    this.observerOptions = {
      root: null, // viewport
      rootMargin: rootMargin,
      threshold: 0 // trigger as soon as element completely leaves/enters
    };

    if (
      typeof window === "undefined" ||
      typeof window.IntersectionObserver === "undefined"
    ) {
      console.warn(
        "IntersectionObserver is not available in this environment. Wave regeneration on intersection will be disabled."
      );
      return;
    }

    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        // Trigger new wave when completely outside viewport
        if (!entry.isIntersecting) {
          // Generate new wave
          this.generateNewWave();

          // If one-time mode, disconnect observer
          if (isOneTime) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
          }
        }
      });
    }, this.observerOptions);

    // Start observing this element
    this.intersectionObserver.observe(this);
  }

  // Public method to morph to a new wave
  /**
   * Generates a new wave animation with the specified duration.
   * Prevents multiple simultaneous wave generations by setting a flag.
   * 
   * @param {number} [duration=800] - The duration of the wave animation in milliseconds. Minimum value is 1.
   */
  generateNewWave(duration = 800) {
    // Prevent multiple simultaneous wave generations
    if (this.isGeneratingWave || this.animationFrameId) {
      return;
    }

    if (duration < 1) duration = 1;

    // Set flag to prevent concurrent wave generations
    this.isGeneratingWave = true;

    // Begin a brand-new transition from a clean timeline. A prior play()/pause()
    // cycle leaves a non-zero elapsedTime behind (used to *resume* that animation).
    // If we don't clear it, animateWave treats this fresh transition as already
    // elapsed and snaps straight to the target instead of tweening. Anchor the
    // start of the tween to whatever shape is currently on screen so pausing
    // mid-animation morphs smoothly rather than jumping back to the last keyframe.
    this.elapsedTime = 0;
    this.startTime = null;

    const displayedPath = this.path && this.path.getAttribute("d");
    if (displayedPath) {
      this.currentPath = displayedPath;
    }

    // Set the pending target path to a new wave
    this.pendingTargetPath = generateWave({
      width: this.width,
      height: this.height,
      points: this.points,
      variance: this.variance,
      vertical: this.vertical,
      random: this.random,
      startEndZero: this.startEndZero,
    });

    // Animate from current path to new target
    this.animateWave(duration, () => {
      // Update paths
      this.currentPath = this.targetPath;
      this.targetPath = this.pendingTargetPath;
      this.pendingTargetPath = null;

      this.updateSeedAttribute(this.currentPath);

      // Reset wave generation flag
      this.isGeneratingWave = false;
      this.animationFrameId = null;
    });
  }

  updateSeedAttribute(pathString) {
    const encodedSeed = encodeWaveSeed(pathString);

    if (encodedSeed) {
      const existing = this.getAttribute("data-wave-seed");

      if (existing !== encodedSeed) {
        this.reflectingSeed = true;
        this.setAttribute("data-wave-seed", encodedSeed);
        this.reflectingSeed = false;
      }
    }
  }

  // Core animation logic
  /**
   * Animates the wave transition from the current path to the target path over a specified duration.
   *
   * @param {number} duration - The duration of the animation in milliseconds.
   * @param {Function} [onComplete=null] - Optional callback function to be called upon animation completion.
   */
  animateWave(duration, onComplete = null) {
    // Ensure we have valid start and target paths
    let startPoints = parsePath(this.currentPath);
    let endPoints = parsePath(this.targetPath);

    if (startPoints.length !== endPoints.length) {
      // Paths with different point counts (e.g. a seed recorded with another
      // data-wave-points value) can't be tweened point-for-point. Rebuild
      // both and carry on animating — bailing out here would strand
      // isAnimating/isGeneratingWave and permanently dead-lock the element.
      console.warn("Point mismatch! Regenerating waves to ensure consistency.");

      this.currentPath = generateWave({
        width: this.width,
        height: this.height,
        points: this.points,
        variance: this.variance,
        vertical: this.vertical,
        random: this.random,
        startEndZero: this.startEndZero,
      });

      this.targetPath = generateWave({
        width: this.width,
        height: this.height,
        points: this.points,
        variance: this.variance,
        vertical: this.vertical,
        random: this.random,
        startEndZero: this.startEndZero,
      });

      if (this.path) {
        this.path.setAttribute("d", this.currentPath);
      }

      startPoints = parsePath(this.currentPath);
      endPoints = parsePath(this.targetPath);
    }

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp - this.elapsedTime;
      const elapsed = timestamp - this.startTime;
      const progress = Math.min(elapsed / duration, 1);

      const interpolatedPath = interpolateWave(
        startPoints,
        endPoints,
        progress,
        this.vertical,
        this.height,
        this.width
      );

      this.path.setAttribute("d", interpolatedPath);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        // Animation completed
        this.elapsedTime = 0;
        this.startTime = null;

        // Call completion callback if provided
        if (onComplete) onComplete();
        if (typeof CustomEvent === "function") {
          this.dispatchEvent(
            new CustomEvent("dynamo-wave-complete", {
              detail: { duration, direction: this.vertical ? "vertical" : "horizontal" }
            })
          );
        }
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }
}

// Custom element definition
if (
  typeof window !== "undefined" &&
  window.customElements &&
  !window.customElements.get("dynamo-wave")
) {
  window.customElements.define("dynamo-wave", DynamoWave);
}

/**
 * Generates an SVG path string representing a wave pattern.
 *
 * @param {Object} options - The options for generating the wave.
 * @param {number} options.width - The width of the wave.
 * @param {number} options.height - The height of the wave.
 * @param {number} options.points - The number of points in the wave.
 * @param {number} options.variance - The variance factor for the wave's randomness.
 * @param {boolean} [options.vertical=false] - Whether the wave should be vertical.
 * @param {Function} [options.random=Math.random] - Random number generator to use.
 * @param {boolean} [options.startEndZero=false] - Whether to force the wave to start and end at zero height.
 * @returns {string} The SVG path string representing the wave.
 */
// Round path coordinates to 2 decimals: visually identical, but roughly
// halves the size of every d-attribute write and encoded seed.
function round2(value) {
  return Math.round(value * 100) / 100;
}

function generateWave({
  width,
  height,
  points,
  variance,
  vertical = false,
  random = Math.random,
  startEndZero = false,
}) {
  const safePoints = Math.max(2, Number.isFinite(points) ? Math.floor(points) : 2);
  const anchors = [];
  const step = vertical ? height / (safePoints - 1) : width / (safePoints - 1);

  for (let i = 0; i < safePoints; i++) {
    const x = round2(vertical
      ? height - step * i
      : step * i);
    const y = round2(vertical
      ? width - width * 0.1 - random() * (variance * width * 0.25)
      : height - height * 0.1 - random() * (variance * height * 0.25));
    anchors.push(vertical ? { x: y, y: x } : { x, y });
  }

  if (startEndZero && anchors.length) {
    if (vertical) {
      anchors[0].x = width;
      anchors[anchors.length - 1].x = width;
    } else {
      anchors[0].y = height;
      anchors[anchors.length - 1].y = height;
    }
  }

  let path = vertical
    ? `M ${width} ${height} L ${anchors[0].x} ${height}`
    : `M 0 ${height} L 0 ${anchors[0].y}`;

  for (let i = 0; i < anchors.length - 1; i++) {
    const curr = anchors[i];
    const next = anchors[i + 1];
    const controlX = round2((curr.x + next.x) / 2);
    const controlY = round2((curr.y + next.y) / 2);
    path += ` Q ${curr.x} ${curr.y}, ${controlX} ${controlY}`;
  }

  const last = anchors[anchors.length - 1];
  path += vertical
    ? ` Q ${last.x} ${last.y}, ${last.x} 0 L ${width} 0 L ${width} ${height} Z`
    : ` Q ${last.x} ${last.y}, ${width} ${last.y} L ${width} ${height} Z`;

  return path;
}

function createSeededRandom(seed) {
  let hash = 0;
  const seedString = String(seed);

  for (let i = 0; i < seedString.length; i++) {
    hash = (hash << 5) - hash + seedString.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  let state = hash >>> 0;

  return function seededRandom() {
    // Mulberry32 PRNG
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function encodeWaveSeed(pathString) {
  if (typeof pathString !== "string") return "";

  const normalizedPath = pathString.trim().replace(/\s+/g, " ");

  try {
    if (typeof btoa === "function") {
      const binaryString = toBinaryString(normalizedPath);
      return btoa(binaryString).replace(/=+$/, "");
    }

    if (typeof Buffer !== "undefined") {
      return Buffer.from(normalizedPath, "utf8").toString("base64").replace(/=+$/, "");
    }
  } catch (error) {
    console.warn("Failed to encode wave seed", error);
  }

  return "";
}

// Short human-friendly seeds (e.g. "test") can be valid base64 and decode
// "successfully" into garbage. Only accept decodes that look like the wave
// paths encodeWaveSeed produces; everything else is treated as a PRNG seed.
function looksLikeWavePath(value) {
  return typeof value === "string" && value.startsWith("M ") && value.includes("Q ");
}

function decodeWaveSeed(seed) {
  if (typeof seed !== "string" || seed.trim() === "") return null;

  const paddedSeed = seed.padEnd(Math.ceil(seed.length / 4) * 4, "=");

  let decoded = null;

  try {
    if (typeof atob === "function") {
      decoded = fromBinaryString(atob(paddedSeed));
    } else if (typeof Buffer !== "undefined") {
      decoded = Buffer.from(paddedSeed, "base64").toString("utf8");
    }
  } catch (error) {
    return null;
  }

  return looksLikeWavePath(decoded) ? decoded : null;
}

function toBinaryString(text) {
  if (typeof TextEncoder !== "undefined") {
    const encoded = new TextEncoder().encode(text);
    let binaryString = "";

    encoded.forEach((byte) => {
      binaryString += String.fromCharCode(byte);
    });

    return binaryString;
  }

  return Array.from(text)
    .map((char) => String.fromCharCode(char.charCodeAt(0)))
    .join("");
}

function fromBinaryString(binaryString) {
  if (typeof TextDecoder !== "undefined") {
    const bytes = Uint8Array.from(binaryString, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  return binaryString;
}

/**
 * Parses a path string containing quadratic Bezier curve commands and extracts the control points and end points.
 *
 * @param {string} pathString - The path string containing 'Q' commands followed by control point and end point coordinates.
 * @returns {Array<Object>} An array of objects, each containing the control point (cpX, cpY) and end point (x, y) coordinates.
 */
function parsePath(pathString) {
  const points = [];
  QUAD_SEGMENT_REGEX.lastIndex = 0;
  let match;

  while ((match = QUAD_SEGMENT_REGEX.exec(pathString)) !== null) {
    points.push({
      cpX: parseFloat(match[1]),
      cpY: parseFloat(match[2]),
      x: parseFloat(match[3]),
      y: parseFloat(match[4]),
    });
  }
  return points;
}

/**
 * Interpolates between two sets of points to create a smooth wave transition.
 *
 * @param {Array<Object>} currentPoints - The current set of points.
 * @param {Array<Object>} targetPoints - The target set of points.
 * @param {number} progress - The progress of the interpolation (0 to 1).
 * @param {boolean} [vertical=false] - Whether the wave is vertical or horizontal.
 * @param {number} height - The height of the wave container.
 * @param {number} width - The width of the wave container.
 * @returns {string} - The SVG path data for the interpolated wave.
 */
function interpolateWave(currentPoints, targetPoints, progress, vertical = false, height, width) {
  const interpolatedPoints = currentPoints.map((current, i) => {
    const target = targetPoints[i];
    return {
      cpX: round2(current.cpX + (target.cpX - current.cpX) * progress),
      cpY: vertical ? current.cpY : round2(current.cpY + (target.cpY - current.cpY) * progress),
      x: vertical ? round2(current.x + (target.x - current.x) * progress) : current.x,
      y: vertical ? current.y : round2(current.y + (target.y - current.y) * progress),
    };
  });

  // The opening line must reach the FIRST anchor, which is the first segment's
  // control point (cpX/cpY) — not its endpoint (x/y), which is the midpoint
  // between anchors 0 and 1. generateWave anchors this line the same way, so
  // using the endpoint here makes the start anchor jump on the first frame
  // (most visible with start-end-zero waves, where the anchor leaves zero).
  let path = vertical
    ? `M ${width} ${height} L ${interpolatedPoints[0].cpX} ${height}`
    : `M 0 ${height} L 0 ${interpolatedPoints[0].cpY}`;

  for (let i = 0; i < interpolatedPoints.length; i++) {
    const { cpX, cpY, x, y } = interpolatedPoints[i];
    path += ` Q ${cpX} ${cpY}, ${x} ${y}`;
  }

  path += vertical
    ? ` L ${width} 0 L ${width} ${height} Z`
    : ` L ${width} ${height} Z`;

  return path;
}

export {
  DynamoWave,
  generateWave,
  parsePath,
  interpolateWave,
  encodeWaveSeed,
  decodeWaveSeed,
};