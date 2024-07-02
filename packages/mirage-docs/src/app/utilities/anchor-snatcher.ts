const _anchorSnatcher = (event: MouseEvent) => {
	const eventPath = event.composedPath();
	const anchor = eventPath.find(el => el instanceof HTMLAnchorElement) as HTMLAnchorElement | undefined;
	if (!anchor || !anchor.classList.contains('internal'))
		return;

	event.preventDefault();

	const route = new URL(anchor.href);
	const path = route.pathname.replace('.md', '');
	const hash = '#' + path;

	// Don't forward external origins to the parent.
	// Either open them in a new tab or in top, depending on if ctrl is being held.
	if (location.origin !== route.origin) {
		if (event.ctrlKey)
			globalThis.open(route.href, '_blank');
		else
			globalThis.open(route.href, '_top');

		return;
	}

	// Intercept hash changes
	if (location.pathname === path) {
		globalThis.history.pushState({}, '', route.origin + route.pathname + route.hash);
		globalThis.dispatchEvent(new HashChangeEvent('hashchange'));

		return;
	}

	// Intercept new routes
	const parent = globalThis.top;
	if (parent) {
		parent.history.pushState({}, '', '/' + hash);
		parent.dispatchEvent(new HashChangeEvent('hashchange'));
	}
};


export const anchorSnatcher = {
	register:   () => globalThis.addEventListener('click', _anchorSnatcher),
	unregister: () => globalThis.removeEventListener('click', _anchorSnatcher),
};
