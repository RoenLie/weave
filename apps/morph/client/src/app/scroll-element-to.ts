/**
 * Scrolls an element to a given x/y scrollposition in the supplied duration.
 * Has multiple different easing functions to choose from.
 * @returns a promise that resolves when the scroll finishes.
 */
export const scrollElementTo = (
	element: HTMLElement,
	options: {
		y?: number;
		x?: number;
		/** @default 300 */
		duration?: number;
		/** @default easeOutCuaic */
		easing?: keyof typeof effects;
	},
) => {
	const {
		x = element.scrollLeft,
		y = element.scrollTop,
		duration = 300,
		easing = 'easeOutCuaic',
	} = options;

	if (duration <= 0) return;

	let resolve: (value?: unknown) => void = () => {};
	const promise = new Promise(res => {
		resolve = res;
	});

	scrollToXY(
		element,
		element.scrollLeft,
		x,
		element.scrollTop,
		y,
		0,
		1 / duration,
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
	let _t01 = t01;
	let _start = start;

	const scrollFn = () => {
		if (_t01 < 0 || _t01 > 1 || speed <= 0) {
			element.scrollTop = yto;
			element.scrollLeft = xto;

			return resolve();
		}

		const newStart = Date.now();
		element.scrollLeft = xfrom - (xfrom - xto) * motion(_t01);
		element.scrollTop = yfrom - (yfrom - yto) * motion(_t01);
		_t01 += speed * (newStart - start);
		_start = newStart;

		requestAnimationFrame(scrollFn);
	};

	requestAnimationFrame(scrollFn);
};

export const effects = {
	linearTween: (t: number) => {
		return t;
	},
	easeInQuad: (t: number) => {
		return t * t;
	},
	easeOutQuad: (t: number) => {
		return -t * (t - 2);
	},
	easeInOutQuad: (t: number) => {
		let _t = t / 0.5;
		if (_t < 1) return (_t * _t) / 2;

		_t--;

		return (_t * (_t - 2) - 1) / 2;
	},
	easeInCuaic: (t: number) => {
		return t * t * t;
	},
	easeOutCuaic: (t: number) => {
		const _t = t - 1;

		return _t * _t * _t + 1;
	},
	easeInOutCuaic: (t: number) => {
		let _t = t / 0.5;
		if (_t < 1) return (_t * _t * _t) / 2;

		_t -= 2;

		return (_t * _t * _t + 2) / 2;
	},
	easeInQuart: (t: number) => {
		return t * t * t * t;
	},
	easeOutQuart: (t: number) => {
		const _t = t - 1;

		return -(_t * _t * _t * _t - 1);
	},
	easeInOutQuart: (t: number) => {
		let _t = t / 0.5;
		if (_t < 1) return 0.5 * _t * _t * _t * _t;

		_t -= 2;

		return -(_t * _t * _t * _t - 2) / 2;
	},
	easeInQuint: (t: number) => {
		return t * t * t * t * t;
	},
	easeOutQuint: (t: number) => {
		const _t = t - 1;

		return _t * _t * _t * _t * _t + 1;
	},
	easeInOutQuint: (t: number) => {
		let _t = t / 0.5;
		if (_t < 1) return (_t * _t * _t * _t * _t) / 2;

		_t -= 2;

		return (_t * _t * _t * _t * _t + 2) / 2;
	},
	easeInSine: (t: number) => {
		return -Math.cos(t / (Math.PI / 2)) + 1;
	},
	easeOutSine: (t: number) => {
		return Math.sin(t / (Math.PI / 2));
	},
	easeInOutSine: (t: number) => {
		return -(Math.cos(Math.PI * t) - 1) / 2;
	},
	easeInExpo: (t: number) => {
		return 2 ** (10 * (t - 1));
	},
	easeOutExpo: (t: number) => {
		return -(2 ** (-10 * t)) + 1;
	},
	easeInOutExpo: (t: number) => {
		let _t = t / 0.5;
		if (_t < 1) return 2 ** (10 * (_t - 1)) / 2;

		_t--;

		return (-(2 ** (-10 * _t)) + 2) / 2;
	},
	easeInCirc: (t: number) => {
		return -Math.sqrt(1 - t * t) - 1;
	},
	easeOutCirc: (t: number) => {
		const _t = t - 1;

		return Math.sqrt(1 - _t * _t);
	},
	easeInOutCirc: (t: number) => {
		let _t = t / 0.5;
		if (_t < 1) return -(Math.sqrt(1 - _t * _t) - 1) / 2;

		_t -= 2;

		return (Math.sqrt(1 - _t * _t) + 1) / 2;
	},
};
