import { type stringliteral } from '../types/strings.types.js';


export interface ElementAnimation {
	keyframes:     Keyframe[];
	rtlKeyframes?: Keyframe[];
	options?:      KeyframeAnimationOptions;
}

export type ElementAnimationMap = Record<string, ElementAnimation>;

export type Direction = 'ltr' | 'rtl' | stringliteral;

export interface GetAnimationOptions {
	/**
	 * The component's directionality.
	 * When set to "rtl", `rtlKeyframes` will be preferred over `keyframes` where
	 * available using getAnimation().
	 */
	dir?: Direction;
}


const defaultAnimationRegistry: Map<string, ElementAnimation> = new Map();
const customAnimationRegistry: WeakMap<Element, ElementAnimationMap> = new WeakMap();

const ensureAnimation = (animation: ElementAnimation | null) => {
	return animation ?? { keyframes: [], options: { duration: 0 } };
};


/**
 * Given an ElementAnimation,
 * this function returns a new ElementAnimation where the keyframes property reflects either
 * keyframes or rtlKeyframes depending on the specified directionality.
 */
const getLogicalAnimation = (animation: ElementAnimation, dir: Direction = 'ltr') => {
	if (dir?.toLowerCase() === 'rtl') {
		return {
			keyframes: animation.rtlKeyframes || animation.keyframes,
			options:   animation.options,
		};
	}

	return animation;
};


/**
 * Sets a default animation. Components should use the `name.animation`
 * for primary animations and `name.part.animation`
 * for secondary animations, e.g. `dialog.show` and `dialog.overlay.show`.
 * For modifiers, use `drawer.showTop`.
 */
export const setDefaultAnimation = (
	animationName: string, animation: ElementAnimation | null,
): void => {
	defaultAnimationRegistry.set(animationName, ensureAnimation(animation));
};


/**
 * Gets an element's animation. Falls back to the default if no animation is found.
 */
export const getAnimation = (
	el: Element, animationName: string, options?: GetAnimationOptions,
): ElementAnimation => {
	const customAnimations = customAnimationRegistry.get(el);
	const animation = customAnimations?.[animationName];

	// Check for a custom animation.
	if (animation)
		return getLogicalAnimation(animation, options?.dir);

	// Fall back to an default or empty animation.
	return getDefaultAnimation(animationName, options);
};


/**
 * Gets a default animation.
 */
export const getDefaultAnimation = (
	animationName: string, options?: GetAnimationOptions,
): ElementAnimation => {
	// Check for a default animation.
	const defaultAnimation = defaultAnimationRegistry.get(animationName);
	if (defaultAnimation)
		return getLogicalAnimation(defaultAnimation, options?.dir);

	// Fall back to an empty animation.
	return {
		keyframes: [],
		options:   { duration: 0 },
	};
};
