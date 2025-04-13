/**
 * Animates an element using keyframes.
 *
 * Returns a promise that resolves after the animation completes or gets canceled.
 */
export const animateTo = (
	el: HTMLElement,
	keyframes: Keyframe[],
	options?: KeyframeAnimationOptions,
): Promise<unknown> => {
	return new Promise(resolve => {
		if (options?.duration === Infinity)
			throw new Error('Promise-based animations must be finite.');

		const animation = el.animate(keyframes, {
			...options,
			duration: prefersReducedMotion() ? 0 : (options?.duration || 0),
		});

		animation.addEventListener('cancel', resolve, { once: true });
		animation.addEventListener('finish', resolve, { once: true });
	});
};


/**
 * Parses a CSS duration and returns the number of milliseconds.
 */
export const parseDuration = (delay: number | string): number => {
	delay = (delay + '').toLowerCase();

	if (delay.indexOf('ms') > -1)
		return parseFloat(delay);


	if (delay.indexOf('s') > -1)
		return parseFloat(delay) * 1000;


	return parseFloat(delay);
};


/**
 * Tells if the user has enabled the "reduced motion" setting in their browser or OS.
 */
export const prefersReducedMotion = (): boolean => {
	const query = window.matchMedia('(prefers-reduced-motion: reduce)');

	return query?.matches;
};


/**
 * Stops all active animations on the target element.
 *
 * Returns a promise that resolves after all animations are canceled.
 */
export const stopAnimations = (el: HTMLElement): Promise<unknown[]> => {
	return Promise.all(
		el.getAnimations().map((animation: any) => {
			return new Promise(resolve => {
				const handleAnimationEvent = requestAnimationFrame(resolve);

				animation.addEventListener('cancel', () => handleAnimationEvent, { once: true });
				animation.addEventListener('finish', () => handleAnimationEvent, { once: true });
				animation.cancel();
			});
		}),
	);
};


/**
 * We can't animate `height: auto`, but we can calculate the height,
 * and shim keyframes by replacing it with the element's scrollHeight before the animation.
 *
 * @example
 * ```ts
 * await animateTo(this.body, shimKeyframesHeightAuto(keyframes, this.body.scrollHeight), options);
 * this.body.style.height = 'auto';
 * ```
 */
export const shimKeyframesHeightAuto = (
	keyframes: Keyframe[],
	calculatedHeight: number,
	initialHeight?: number,
): (Keyframe & { height: string | number | null | undefined; })[] => {
	if (initialHeight) {
		Object.assign(keyframes.at(0) ?? {}, {
			height: initialHeight + 'px',
		});
	}

	return keyframes.map(keyframe =>
		Object.assign(
			{},
			keyframe,
			{ height: keyframe['height'] === 'auto' ? `${ calculatedHeight }px` : keyframe['height'] },
		));
};
