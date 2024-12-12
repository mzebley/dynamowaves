(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  class DynamoWave extends HTMLElement {
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
    }

    connectedCallback() {
      const classes = this.className;
      const id = this.id ?? Math.random().toString(36).substring(7);
      const styles = this.getAttribute("style");

      const waveDirection = this.getAttribute("data-wave-face") || "top";
      this.points = parseInt(this.getAttribute("data-wave-points")) || 6;
      this.variance = parseFloat(this.getAttribute("data-variance")) || 3;
      this.duration = parseFloat(this.getAttribute("data-wave-speed")) || 7500;

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
      });

      this.targetPath = generateWave({
        width: this.width,
        height: this.height,
        points: this.points,
        variance: this.variance,
        vertical: this.vertical,
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
        role="img"
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
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          this.play();
        }
      }
    }

    // Public method to play the animation
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
    pause() {
      if (!this.isAnimating) return;
      this.isAnimating = false;
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;

      // Save the current elapsed time
      this.elapsedTime += performance.now() - (this.startTime || performance.now());
      this.startTime = null;
    }

    disconnectedCallback() {
      // Clean up intersection observer when element is removed
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
    }

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
        });

        this.targetPath = generateWave({
          width: this.width,
          height: this.height,
          points: this.points,
          variance: this.variance,
          vertical: this.vertical,
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
        }
      };

      this.animationFrameId = requestAnimationFrame(animate);
    }
  }

  // Custom element definition
  customElements.define("dynamo-wave", DynamoWave);
  // Existing helper functions remain the same (generateWave, parsePath, interpolateWave)
  function generateWave({ width, height, points, variance, vertical = false }) {
    const anchors = [];
    const step = vertical ? height / (points - 1) : width / (points - 1);

    for (let i = 0; i < points; i++) {
      const x = vertical
        ? height - step * i
        : step * i;
      const y = vertical
        ? width - width * 0.1 - Math.random() * (variance * width * 0.25)
        : height - height * 0.1 - Math.random() * (variance * height * 0.25);
      anchors.push(vertical ? { x: y, y: x } : { x, y });
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

  function parsePath(pathString) {
    const points = [];
    const regex = /Q\s([\d.]+)\s([\d.]+),\s([\d.]+)\s([\d.]+)/g;
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
