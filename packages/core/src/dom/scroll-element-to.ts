/**
 * Scrolls an element to a given x/y scrollposition in the supplied duration.
 * Has multiple different easing functions to choose from.
 * @returns a promise that resolves when the scroll finishes.
 */
export const scrollElementTo = (element: HTMLElement, options: {
	y?:        number;
	x?:        number;
	/** @default 300 */
	duration?: number;
	/** @default easeOutCuaic */
	easing?:   keyof typeof effects;
}): Promise<unknown> | undefined => {
	const {
		x = element.scrollLeft,
		y = element.scrollTop,
		duration = 300,
		easing = 'easeOutCuaic',
	} = options;

	if (duration <= 0)
		return;

	let resolve: (value?: unknown) => void = () => {};
	const promise = new Promise(res => resolve = res);

	scrollToXY(
		element,
		element.scrollLeft, x,
		element.scrollTop, y,
		0, 1 / duration,
		Date.now(),
		effects[easing],
		resolve,
	);

	return promise;
};


const scrollToXY = (
	element: HTMLElement,
	xfrom: number,
	xto: number,
	yfrom: number,
	yto: number,
	t01: number,
	speed: number,
	start: number,
	motion: (num: number) => number,
	resolve: (value?: unknown) => void,
) => {
	const scrollFn = () => {
		if (t01 < 0 || t01 > 1 || speed <= 0) {
			element.scrollTop = yto;
			element.scrollLeft = xto;

			return resolve();
		}

		const newStart = Date.now();
		element.scrollLeft = xfrom - (xfrom - xto) * motion(t01);
		element.scrollTop = yfrom - (yfrom - yto) * motion(t01);
		t01 += speed * (newStart - start);
		start = newStart;

		requestAnimationFrame(scrollFn);
	};

	requestAnimationFrame(scrollFn);
};


export const effects = {
	linearTween: (t: number): number =>{
		return t;
	},
	easeInQuad: (t: number): number =>{
		return t * t;
	},
	easeOutQuad: (t: number): number =>{
		return -t * (t - 2);
	},
	easeInOutQuad: (t: number): number =>{
		t /= 0.5;
		if (t < 1)
			return t * t / 2;

		t--;

		return (t * (t - 2) - 1) / 2;
	},
	easeInCuaic: (t: number): number =>{
		return t * t * t;
	},
	easeOutCuaic: (t: number): number =>{
		t--;

		return t * t * t + 1;
	},
	easeInOutCuaic: (t: number): number =>{
		t /= 0.5;
		if (t < 1)
			return t * t * t / 2;

		t -= 2;

		return (t * t * t + 2) / 2;
	},
	easeInQuart: (t: number): number =>{
		return t * t * t * t;
	},
	easeOutQuart: (t: number): number =>{
		t--;

		return -(t * t * t * t - 1);
	},
	easeInOutQuart: (t: number): number =>{
		t /= 0.5;
		if (t < 1)
			return 0.5 * t * t * t * t;

		t -= 2;

		return -(t * t * t * t - 2) / 2;
	},
	easeInQuint: (t: number): number =>{
		return t * t * t * t * t;
	},
	easeOutQuint: (t: number): number =>{
		t--;

		return t * t * t * t * t + 1;
	},
	easeInOutQuint: (t: number): number =>{
		t /= 0.5;
		if (t < 1)
			return t * t * t * t * t / 2;

		t -= 2;

		return (t * t * t * t * t + 2) / 2;
	},
	easeInSine: (t: number): number => {
		return -Math.cos(t / (Math.PI / 2)) + 1;
	},
	easeOutSine: (t: number): number => {
		return Math.sin(t / (Math.PI / 2));
	},
	easeInOutSine: (t: number): number => {
		return -(Math.cos(Math.PI * t) - 1) / 2;
	},
	easeInExpo: (t: number): number => {
		return Math.pow(2, 10 * (t - 1));
	},
	easeOutExpo: (t: number): number => {
		return -Math.pow(2, -10 * t) + 1;
	},
	easeInOutExpo: (t: number): number => {
		t /= 0.5;
		if (t < 1)
			return Math.pow(2, 10 * (t - 1)) / 2;

		t--;

		return (-Math.pow(2, -10 * t) + 2) / 2;
	},
	easeInCirc: (t: number): number => {
		return -Math.sqrt(1 - t * t) - 1;
	},
	easeOutCirc: (t: number): number => {
		t--;

		return Math.sqrt(1 - t * t);
	},
	easeInOutCirc: (t: number): number => {
		t /= 0.5;
		if (t < 1)
			return -(Math.sqrt(1 - t * t) - 1) / 2;

		t -= 2;

		return (Math.sqrt(1 - t * t) + 1) / 2;
	},
};
