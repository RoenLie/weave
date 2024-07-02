export const getMultipleBoundingClientRects = (...elements: (Element | null)[]) => {
	return elements.reduce((a, b) => {
		a.push(b?.getBoundingClientRect());

		return a;
	}, [] as (DOMRect | undefined)[]);
};
