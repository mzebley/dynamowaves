(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  class DynamoWave extends HTMLElement {
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
      const classes = this.className;
      const id = this.id ?? Math.random().toString(36).substring(7);
      const styles = this.getAttribute("style");

      const waveDirection = this.getAttribute("data-wave-face") || "top";
      const pointsAttr = parseInt(this.getAttribute("data-wave-points"), 10);
      this.points = Number.isFinite(pointsAttr) ? Math.max(2, pointsAttr) : 6;

      const varianceAttr = this.getAttribute("data-wave-variance");
      const legacyVarianceAttr = this.getAttribute("data-variance");
      const parsedVariance = parseFloat(varianceAttr ?? legacyVarianceAttr ?? "");
      this.variance = Number.isFinite(parsedVariance) ? parsedVariance : 3;
      this.duration = parseFloat(this.getAttribute("data-wave-speed")) || 7500;

      const seedAttr = this.getAttribute("data-wave-seed");
      this.random = typeof seedAttr === "string" && seedAttr.trim() !== ""
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

      // Construct the SVG
      this.innerHTML = `
      <svg 
        viewBox="${this.vertical ? "0 0 160 1440" : "0 0 1440 160"}"
        preserveAspectRatio="none"
        class="${classes || ""}"
        style="${flipX ? "transform:scaleX(-1);" : ""}${flipY ? "transform:scaleY(-1);" : ""}${styles || ""}"
        id="${id}"
        aria-hidden="true"
        role="presentation"
      >
        <path d="${this.currentPath}" style="stroke:inherit; fill: inherit"></path>
      </svg>
    `;

      // Save SVG references
      this.svg = this.querySelector("svg");
      this.path = this.querySelector("path");

      // Bind methods
      this.play = this.play.bind(this);
      this.pause = this.pause.bind(this);
      this.generateNewWave = this.generateNewWave.bind(this);

      // Check for wave observation attribute
      const observeAttr = this.getAttribute("data-wave-observe");
      if (observeAttr) {
        this.setupIntersectionObserver(observeAttr);
      }

      // Automatically start animation if enabled
      if (this.getAttribute("data-wave-animate") === "true") {
        if (
          typeof window !== "undefined" &&
          typeof window.matchMedia === "function" &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          this.play();
        }
      }
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
      if (this.isAnimating) return;
      this.isAnimating = true;

      // Use custom duration if provided, otherwise use the instance duration
      const animationDuration = customDuration || this.duration;

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
      if (!this.isAnimating) return;
      this.isAnimating = false;
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;

      // Save the current elapsed time
      this.elapsedTime += performance.now() - (this.startTime || performance.now());
      this.startTime = null;
    }

    /**
     * Called when the element is disconnected from the document's DOM.
     * Cleans up the intersection observer if it exists.
     */
    disconnectedCallback() {
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

        // Reset wave generation flag
        this.isGeneratingWave = false;
        this.animationFrameId = null;
      });
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
      const startPoints = parsePath(this.currentPath);
      const endPoints = parsePath(this.targetPath);

      if (startPoints.length !== endPoints.length) {
        console.error("Point mismatch! Regenerating waves to ensure consistency.");
        
        // Regenerate both current and target paths to ensure consistency
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

        return;
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
      const x = vertical
        ? height - step * i
        : step * i;
      const y = vertical
        ? width - width * 0.1 - random() * (variance * width * 0.25)
        : height - height * 0.1 - random() * (variance * height * 0.25);
      anchors.push(vertical ? { x: y, y: x } : { x, y });
    }

    if (startEndZero && anchors.length) {
      if (vertical) {
        anchors[0].x = width;
        anchors[anchors.length - 1].x = 0;
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
      const controlX = (curr.x + next.x) / 2;
      const controlY = (curr.y + next.y) / 2;
      path += ` Q ${curr.x} ${curr.y}, ${controlX} ${controlY}`;
    }

    const last = anchors[anchors.length - 1];
    path += vertical
      ? ` Q ${last.x} ${last.y}, 0 0 L ${width} 0 L ${width} ${height} Z`
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

  /**
   * Parses a path string containing quadratic Bezier curve commands and extracts the control points and end points.
   *
   * @param {string} pathString - The path string containing 'Q' commands followed by control point and end point coordinates.
   * @returns {Array<Object>} An array of objects, each containing the control point (cpX, cpY) and end point (x, y) coordinates.
   */
  function parsePath(pathString) {
    const points = [];
    const numberPattern = "[+-]?\\d*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?";
    const regex = new RegExp(`Q\\s(${numberPattern})\\s(${numberPattern}),\\s(${numberPattern})\\s(${numberPattern})`, "g");
    let match;

    while ((match = regex.exec(pathString)) !== null) {
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
        cpX: current.cpX + (target.cpX - current.cpX) * progress,
        cpY: vertical ? current.cpY : current.cpY + (target.cpY - current.cpY) * progress,
        x: vertical ? current.x + (target.x - current.x) * progress : current.x,
        y: vertical ? current.y : current.y + (target.y - current.y) * progress,
      };
    });

    let path = vertical
      ? `M ${width} ${height} L ${interpolatedPoints[0].x} ${height}`
      : `M 0 ${height} L 0 ${interpolatedPoints[0].y}`;

    for (let i = 0; i < interpolatedPoints.length; i++) {
      const { cpX, cpY, x, y } = interpolatedPoints[i];
      path += ` Q ${cpX} ${cpY}, ${x} ${y}`;
    }

    path += vertical
      ? ` L 0 0 L ${width} 0 L ${width} ${height} Z`
      : ` L ${width} ${height} Z`;

    return path;
  }

}));
