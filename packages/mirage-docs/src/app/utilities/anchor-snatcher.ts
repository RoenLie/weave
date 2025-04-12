import type { SiteConfig } from '../../shared/config.types.ts';
import { ContainerLoader } from '../aegis/index.js';


const _anchorSnatcher = (event: MouseEvent): void => {
	const eventPath = event.composedPath();
	const anchor = eventPath.find(el => el instanceof HTMLAnchorElement);
	if (!anchor || !anchor.classList.contains('internal'))
		return;

	event.preventDefault();

	const route = new URL(anchor.href);
	const path = route.pathname.replace('.md', '');

	// Don't forward external origins to the parent.
	// Either open them in a new tab or in top, depending on if ctrl is being held.
	if (location.origin !== route.origin) {
		if (event.ctrlKey || event.metaKey)
			globalThis.open(route.href, '_blank');
		else
			globalThis.open(route.href, '_top');

		return;
	}

	// Intercept hash changes
	if (location.pathname === path) {
		globalThis.history.pushState({}, '', route.origin + route.pathname + route.hash);
		globalThis.dispatchEvent(new HashChangeEvent('hashchange'));
	}

	// Intercept new routes
	const parent = globalThis.top;
	if (parent) {
		const { base, libDir } = ContainerLoader.get<SiteConfig>('site-config').env;
		const hash = path
			.replace(base + '/' + libDir, '')
			.replace('.html', '');

		parent.history.pushState({}, '', base + '/#' + hash + route.hash);
		parent.dispatchEvent(new HashChangeEvent('hashchange'));
	}
};


export const anchorSnatcher: {
	register:   () => void;
	unregister: () => void;
} = {
	register:   () => globalThis.addEventListener('click', _anchorSnatcher),
	unregister: () => globalThis.removeEventListener('click', _anchorSnatcher),
};
