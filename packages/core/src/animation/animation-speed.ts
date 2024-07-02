import { parseDuration } from './animate.js';

type AnimationSpeed = 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';

export const animationSpeed = (speed: AnimationSpeed, el: HTMLElement = document.body) =>
	parseDuration(getComputedStyle(el).getPropertyValue('--transition-' + speed));
