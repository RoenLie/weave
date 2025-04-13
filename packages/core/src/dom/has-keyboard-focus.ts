export const hasKeyboardFocus = (elements: Element | Element[]): boolean => {
	if (!Array.isArray(elements))
		elements = [ elements ];

	if (!elements?.length)
		return false;

	const hasFocus = elements.some(element => {
		let focusCheck = element.matches(':focus-visible');
		if (focusCheck)
			return true;

		focusCheck = hasKeyboardFocus(Array.from(element.children));
		if (focusCheck)
			return true;

		if (element.shadowRoot)
			focusCheck = hasKeyboardFocus(Array.from(element.shadowRoot.children));

		return focusCheck;
	});

	return hasFocus;
};
