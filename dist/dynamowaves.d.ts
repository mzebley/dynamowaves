/** Options accepted by the low-level `generateWave` helper. */
interface WaveGenerationOptions {
  width: number;
  height: number;
  points: number;
  variance: number;
  vertical?: boolean;
  random?: () => number;
  startEndZero?: boolean;
}

/** One quadratic control point and its segment endpoint. */
interface WavePoint {
  cpX: number;
  cpY: number;
  x: number;
  y: number;
}

type WaveDirection = 'top' | 'bottom' | 'left' | 'right';
type WaveOrientation = 'horizontal' | 'vertical';

interface WaveObserverOptions {
  root: Element | null;
  rootMargin: string;
  threshold: number;
}

interface DynamoWaveCompleteDetail {
  duration: number;
  direction: WaveOrientation;
}

interface DynamoWaveEventMap {
  'dynamo-wave-complete': CustomEvent<DynamoWaveCompleteDetail>;
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
  private desiredPlaying: boolean | null;
  private loopDuration: number | null;
  private motionQuery: MediaQueryList | null;
  private finishAnimation: (() => void) | null;
  private reflectingSeed: boolean;

  static readonly observedAttributes: string[];

  constructor();

  // Lifecycle methods
  connectedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null
  ): void;

  // Public methods
  play(customDuration?: number | null): void;
  pause(): void;
  generateNewWave(duration?: number): void;

  // Private methods
  private renderWave(): void;
  private createWavePath(): string;
  private stopAnimation(reset?: boolean): void;
  private reinitialize(): void;
  private updateSeedAttribute(pathString: string): void;
  private setupMotionPreferenceListener(): void;
  private handleMotionPreferenceChange(event: MediaQueryListEvent): void;
  private setupIntersectionObserver(observeConfig: string): void;
  private animateWave(duration: number, onComplete?: (() => void) | null): void;
}

declare function generateWave(options: WaveGenerationOptions): string;
declare function parsePath(pathString: string): WavePoint[];
declare function interpolateWave(
  currentPoints: WavePoint[],
  targetPoints: WavePoint[],
  progress: number,
  vertical: boolean,
  height: number,
  width: number
): string;
declare function encodeWaveSeed(pathString: string): string;
declare function decodeWaveSeed(seed: string): string | null;

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

/** Framework-neutral host props for runtimes that use the global JSX namespace. */
interface DynamoWaveJSXAttributes extends DynamoWaveAttributes {
  id?: string;
  class?: string;
  className?: string;
  style?: string | Record<string, string | number | undefined>;
  title?: string;
  role?: string;
  slot?: string;
  lang?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  hidden?: boolean | 'hidden' | 'until-found';
  inert?: boolean;
  tabindex?: number;
  tabIndex?: number;
  children?: unknown;
  ref?: ((element: DynamoWave | null) => void) | { current: DynamoWave | null };
  [attribute: `aria-${string}`]: string | number | boolean | undefined;
  [attribute: `data-${string}`]: string | undefined;
}

declare global {
  interface HTMLElementTagNameMap {
    'dynamo-wave': DynamoWave;
  }

  interface HTMLElementEventMap extends DynamoWaveEventMap {}
  
  namespace JSX {
    interface IntrinsicElements {
      'dynamo-wave': DynamoWaveJSXAttributes;
    }
  }
}

export { DynamoWave, type DynamoWaveAttributes, type DynamoWaveCompleteDetail, type DynamoWaveEventMap, type DynamoWaveJSXAttributes, type WaveDirection, type WaveGenerationOptions, type WaveObserverOptions, type WaveOrientation, type WavePoint, decodeWaveSeed, encodeWaveSeed, generateWave, interpolateWave, parsePath };
