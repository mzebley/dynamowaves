import fontSizeTokens from '../../tokens/zbk-font-size.tokens.json';

export const TEXT_SIZE_LEVELS = ['sm', 'md', 'lg', 'xl'] as const;
export type TextSize = (typeof TEXT_SIZE_LEVELS)[number];

export const TEXT_SIZE_SCALE: Record<TextSize, number> = {
	sm: 0.92,
	md: 1,
	lg: 1.15,
	xl: 1.5,
};

export const TEXT_SIZE_LABELS: Record<TextSize, string> = {
	sm: 'Small',
	md: 'Default',
	lg: 'Large',
	xl: 'Extra large',
};

export const ZEBKIT_FONT_SIZE_STEPS = [
	'3xs',
	'2xs',
	'xs',
	'sm',
	'md',
	'lg',
	'xl',
	'2xl',
	'3xl',
] as const;

type ZebkitFontSizeStep = (typeof ZEBKIT_FONT_SIZE_STEPS)[number];

const ZEBKIT_FONT_SIZE_STEP_OFFSETS: Record<ZebkitFontSizeStep, number> = {
	'3xs': -4,
	'2xs': -3,
	xs: -2,
	sm: -1,
	md: 0,
	lg: 1,
	xl: 2,
	'2xl': 3,
	'3xl': 4,
};

const DEFAULT_NONLINEAR_TYPE_SCALE_STRENGTH = 0.725;
const tokenScale = fontSizeTokens.$extensions['dev.zebkit'].scale;

function numericTokenValue(value: string): number {
	const parsed = Number.parseFloat(value);
	if (!Number.isFinite(parsed)) throw new Error(`Invalid Zebkit type-scale value: ${value}`);
	return parsed;
}

const ZEBKIT_FLUID_TYPE_SCALE = {
	minViewport: numericTokenValue(tokenScale['min-viewport']),
	maxViewport: numericTokenValue(tokenScale['max-viewport']),
	minBase: numericTokenValue(tokenScale['min-base']),
	maxBase: numericTokenValue(tokenScale['max-base']),
	minRatio: tokenScale['min-ratio'],
	maxRatio: tokenScale['max-ratio'],
};

function fluidScaleProgress(viewportWidth: number): number {
	const { minViewport, maxViewport } = ZEBKIT_FLUID_TYPE_SCALE;
	return Math.min(1, Math.max(0, (viewportWidth - minViewport) / (maxViewport - minViewport)));
}

function fluidStepBase(step: ZebkitFontSizeStep, viewportWidth: number): number {
	const { minBase, maxBase, minRatio, maxRatio } = ZEBKIT_FLUID_TYPE_SCALE;
	const offset = ZEBKIT_FONT_SIZE_STEP_OFFSETS[step];
	const progress = fluidScaleProgress(viewportWidth);
	const min = minBase * Math.pow(minRatio, offset);
	const max = maxBase * Math.pow(maxRatio, offset);
	return min + (max - min) * progress;
}

function nonlinearTypeMultiplier(base: number, zoom: number, strength: number, pivot: number) {
	return 1 + (zoom - 1) * Math.pow(pivot / base, strength);
}

/**
 * Apply mz-svelte's non-linear reader zoom curve to this project's Zebkit
 * type steps. Smaller copy receives more of an increase so labels and body
 * text stay legible without making display sizes grow at the same rate.
 */
export function createZebkitFontSizeModifiers(
	textSize: TextSize,
	viewportWidth: number,
): Record<ZebkitFontSizeStep, number> {
	const zoom = TEXT_SIZE_SCALE[textSize];
	const pivot = fluidStepBase('md', viewportWidth);
	const strength = zoom < 1
		? -DEFAULT_NONLINEAR_TYPE_SCALE_STRENGTH
		: DEFAULT_NONLINEAR_TYPE_SCALE_STRENGTH;

	return Object.fromEntries(
		ZEBKIT_FONT_SIZE_STEPS.map((step) => {
			const modifier = nonlinearTypeMultiplier(
				fluidStepBase(step, viewportWidth),
				zoom,
				strength,
				pivot,
			);
			return [step, Number(modifier.toFixed(6))];
		}),
	) as Record<ZebkitFontSizeStep, number>;
}

export function applyTextSize(root: HTMLElement, textSize: TextSize, viewportWidth: number) {
	const modifiers = createZebkitFontSizeModifiers(textSize, viewportWidth);
	root.dataset.a11yTextSize = textSize;

	for (const step of ZEBKIT_FONT_SIZE_STEPS) {
		root.style.setProperty(`--zbk-a11y-font-size-modifier-${step}`, String(modifiers[step]));
	}
}

export function isTextSize(value: string | undefined | null): value is TextSize {
	return TEXT_SIZE_LEVELS.includes(value as TextSize);
}
