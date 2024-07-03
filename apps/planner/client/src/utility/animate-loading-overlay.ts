import { animateTo, animationSpeed, getAnimation, setDefaultAnimation, stopAnimations } from '@roenlie/core/animation';
import { AsyncFn, Fn } from '@roenlie/core/types';
import { LitElement } from 'lit';


type LoadableElement = {
	loading: boolean;
} & LitElement


export const animateLoading = async (
	el: LoadableElement,
	overlayElQuery: () => HTMLElement | null | undefined,
	action: Fn | AsyncFn,
) => {
	el.loading = true;
	await el.updateComplete;

	const overlayEl = overlayElQuery();
	if (!overlayEl) {
		el.loading = false;
		throw ('Overlay element could not be found.');
	}

	await stopAnimations(overlayEl);

	const animationShow = getAnimation(el, 'overlay.show');
	await animateTo(overlayEl, animationShow.keyframes, animationShow.options);

	await action();

	const animationHide = getAnimation(el, 'overlay.hide');
	await animateTo(overlayEl, animationHide.keyframes, animationHide.options);
	el.loading = false;
};


const animSpeed = animationSpeed('fast');

setDefaultAnimation('overlay.show', {
	keyframes: [
		{ opacity: 0 },
		{ opacity: 1 },
	],
	options: { duration: animSpeed, easing: 'ease-out' },
});

setDefaultAnimation('overlay.hide', {
	keyframes: [
		{ opacity: 1 },
		{ opacity: 0 },
	],
	options: { duration: animSpeed, easing: 'ease-in' },
});
