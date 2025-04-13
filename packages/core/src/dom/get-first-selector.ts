type El = (HTMLElement & ShadowRoot);

export const getFirstSelector = (startEl: HTMLElement, selector: string): El | undefined => {
	let el = startEl as El;
	do {
		const result = el.matches?.(selector);
		if (result)
			return el;
	} while ((el = el.host as El || el.parentNode || el.parentElement as El || el.offsetParent as El) && el);
};
