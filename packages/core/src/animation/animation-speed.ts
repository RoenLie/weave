import { parseDuration } from './animate.js';


type AnimationSpeed = 'x-slow' | 'slow' | 'medium' | 'fast' | 'x-fast';

export const animationSpeed = (speed: AnimationSpeed, el: HTMLElement = document.body): number =>
	parseDuration(getComputedStyle(el).getPropertyValue('--transition-' + speed));
