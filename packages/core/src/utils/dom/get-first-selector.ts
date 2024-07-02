export const getFirstSelector = (startEl: HTMLElement, selector: string) => {
	type El = (HTMLElement & ShadowRoot);
	let el = startEl as El;
	do {
		let result = el.matches?.(selector);
		if (result)
			return el;
	} while ((el = el.host as El || el.parentNode || el.parentElement as El || el.offsetParent as El) && el);
};
