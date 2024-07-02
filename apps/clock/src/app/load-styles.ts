export const loadStyles = (url: string, links: {id: string; href: string;}[]) => {
	links.forEach(style => {
		if (document.head.querySelector('#' + style.id))
			return;

		url = url.replace(/\/+$/, '');

		const linkEl = document.createElement('link');
		linkEl.id = style.id;
		linkEl.rel = 'stylesheet';
		linkEl.href = url + ('/' + style.href)
			.replaceAll(location.origin, '')
			.replaceAll(/\/+/g, '/')
			.replaceAll(/\/$/g, '');

		document.head.appendChild(linkEl);
	});
};
