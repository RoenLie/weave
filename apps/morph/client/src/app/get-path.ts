export const getPath = (startEl: Element | ShadowRoot) => {
	const path: Element[] = [];

	type El = HTMLElement & ShadowRoot;
	let el = startEl as El;
	do {
		path.push(el);

		el =
			(el.host as El) ||
			el.parentNode ||
			(el.parentElement as El) ||
			(el.offsetParent as El);
	} while (el);

	return path;
};
