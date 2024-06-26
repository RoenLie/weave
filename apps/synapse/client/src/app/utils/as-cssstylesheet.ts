export const stylesheet = (css: string) => {
	const style = new CSSStyleSheet();
	style.replaceSync(css);

	return style;
};
