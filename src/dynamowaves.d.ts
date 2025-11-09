// dynamoves.d.ts

// Interface for wave generation options
interface WaveGenerationOptions {
  width: number;
  height: number;
  points: number;
  variance: number;
  vertical?: boolean;
  random?: () => number;
  startEndZero?: boolean;
}

// Interface for wave point structure
interface WavePoint {
  cpX: number;
  cpY: number;
  x: number;
  y: number;
}

// Type for the wave direction
type WaveDirection = 'top' | 'bottom' | 'left' | 'right';

// Interface for intersection observer options
interface WaveObserverOptions {
  root: Element | null;
  rootMargin: string;
  threshold: number;
}

declare class DynamoWave extends HTMLElement {
  // Properties
  private isAnimating: boolean;
  private animationFrameId: number | null;
  private elapsedTime: number;
  private startTime: number | null;
  private isGeneratingWave: boolean;
  private currentPath: string | null;
  private targetPath: string | null;
  private pendingTargetPath: string | null;
  private intersectionObserver: IntersectionObserver | null;
  private observerOptions: WaveObserverOptions | null;
  private points: number;
  private variance: number;
  private duration: number;
  private vertical: boolean;
  private width: number;
  private height: number;
  private svg: SVGSVGElement;
  private path: SVGPathElement;
  private random: () => number;
  private startEndZero: boolean;

  constructor();
  
  // Lifecycle methods
  connectedCallback(): void;
  disconnectedCallback(): void;

  // Public methods
  play(customDuration?: number | null): void;
  pause(): void;
  generateNewWave(duration?: number): void;

  // Private methods
  private setupIntersectionObserver(observeConfig: string): void;
  private animateWave(duration: number, onComplete?: (() => void) | null): void;
}

// Helper function declarations
declare function generateWave(options: WaveGenerationOptions): string;
declare function parsePath(pathString: string): WavePoint[];
declare function interpolateWave(
  currentPoints: WavePoint[],
  targetPoints: WavePoint[],
  progress: number,
  vertical?: boolean,
  height?: number,
  width?: number
): string;

// Global declaration for custom element
declare global {
  interface HTMLElementTagNameMap {
    'dynamo-wave': DynamoWave;
  }
}

// Component attributes interface
interface DynamoWaveAttributes {
  'data-wave-face'?: WaveDirection;
  'data-wave-points'?: string;
  'data-wave-variance'?: string;
  'data-variance'?: string;
  'data-wave-speed'?: string;
  'data-wave-animate'?: string;
  'data-wave-observe'?: string;
  'data-wave-seed'?: string;
  'data-start-end-zero'?: string;
}

// Extend HTMLElement interface to include our attributes
declare global {
  interface HTMLElementTagNameMap {
    'dynamo-wave': DynamoWave;
  }
  
  namespace JSX {
    interface IntrinsicElements {
      'dynamo-wave': Partial<DynamoWaveAttributes>;
    }
  }
}

export {
  DynamoWave,
  WaveGenerationOptions,
  WavePoint,
  WaveDirection,
  WaveObserverOptions,
  DynamoWaveAttributes
};