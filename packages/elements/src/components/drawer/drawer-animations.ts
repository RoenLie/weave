import { animationSpeed, setDefaultAnimation } from '@roenlie/core/animation';

export const registerDrawerAnimations = () => {
	const animationDurationMs = animationSpeed('medium');

	//#region top animation
	setDefaultAnimation('drawer.showTop', {
		keyframes: [
			{ opacity: 0, transform: 'translateY(-100%)' },
			{ opacity: 1, transform: 'translateY(0)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});

	setDefaultAnimation('drawer.hideTop', {
		keyframes: [
			{ opacity: 1, transform: 'translateY(0)' },
			{ opacity: 0, transform: 'translateY(-100%)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});
	//#endregion


	//#region bottom animation
	setDefaultAnimation('drawer.showBottom', {
		keyframes: [
			{ opacity: 0, transform: 'translateY(100%)' },
			{ opacity: 1, transform: 'translateY(0)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});

	setDefaultAnimation('drawer.hideBottom', {
		keyframes: [
			{ opacity: 1, transform: 'translateY(0)' },
			{ opacity: 0, transform: 'translateY(100%)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});
	//#endregion


	//#region end animation
	setDefaultAnimation('drawer.showEnd', {
		keyframes: [
			{ opacity: 0, transform: 'translateX(100%)' },
			{ opacity: 1, transform: 'translateX(0)' },
		],
		rtlKeyframes: [
			{ opacity: 0, transform: 'translateX(-100%)' },
			{ opacity: 1, transform: 'translateX(0)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});

	setDefaultAnimation('drawer.hideEnd', {
		keyframes: [
			{ opacity: 1, transform: 'translateX(0)' },
			{ opacity: 0, transform: 'translateX(100%)' },
		],
		rtlKeyframes: [
			{ opacity: 1, transform: 'translateX(0)' },
			{ opacity: 0, transform: 'translateX(-100%)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});
	//#endregion


	//#region start animation
	setDefaultAnimation('drawer.showStart', {
		keyframes: [
			{ opacity: 0, transform: 'translateX(-100%)' },
			{ opacity: 1, transform: 'translateX(0)' },
		],
		rtlKeyframes: [
			{ opacity: 0, transform: 'translateX(100%)' },
			{ opacity: 1, transform: 'translateX(0)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});

	setDefaultAnimation('drawer.hideStart', {
		keyframes: [
			{ opacity: 1, transform: 'translateX(0)' },
			{ opacity: 0, transform: 'translateX(-100%)' },
		],
		rtlKeyframes: [
			{ opacity: 1, transform: 'translateX(0)' },
			{ opacity: 0, transform: 'translateX(100%)' },
		],
		options: { duration: animationDurationMs, easing: 'ease' },
	});
	//#endregion


	//#region overlay animation
	setDefaultAnimation('drawer.overlay.show', {
		keyframes: [ { opacity: 0 }, { opacity: 1 } ],
		options:   { duration: animationDurationMs },
	});

	setDefaultAnimation('drawer.overlay.hide', {
		keyframes: [ { opacity: 1 }, { opacity: 0 } ],
		options:   { duration: animationDurationMs },
	});
	//#endregion


	// Deny close
	setDefaultAnimation('drawer.denyClose', {
		keyframes: [ { transform: 'scale(1)' }, { transform: 'scale(1.01)' }, { transform: 'scale(1)' } ],
		options:   { duration: animationDurationMs },
	});
};
