import { LitElement } from 'lit';

import type { SiteConfig } from '../../shared/config.types.js';
import { container } from '../container/container.js';


const subscribers: Set<WeakRef<LitElement>> = new Set();


export const subscribeToColorChange = (element: LitElement): void => {
	subscribers.add(new WeakRef(element));
};


export const getColorScheme = (): string => {
	const localTheme = localStorage.getItem('midocColorScheme') ?? 'dark';
	const currentTheme = document.documentElement.getAttribute('color-scheme') ?? localTheme;

	return currentTheme;
};


export const setColorScheme = (theme: string): void => {
	localStorage.setItem('midocColorScheme', theme);
	document.documentElement.setAttribute('color-scheme', theme);

	updateColorSchemeLinks();
};


export const ensureColorScheme = (): void => {
	const currentTheme = getColorScheme();
	setColorScheme(currentTheme);
};


export const toggleColorScheme = (): 'dark' | 'light' => {
	const localTheme = localStorage.getItem('midocColorScheme') ?? 'dark';
	const currentTheme = document.documentElement.getAttribute('color-scheme') ?? localTheme;
	const nextTheme = currentTheme === 'light' ? 'dark' : 'light';

	setColorScheme(nextTheme);

	return nextTheme;
};


export const updateColorSchemeLinks = (): void => {
	const cfg = container.get<SiteConfig>('site-config');

	const mode = getColorScheme();
	const obj = window.top === window ? cfg.root : cfg.pages;
	const themeHrefs = mode === 'dark'
		? obj.darkTheme
		: obj.lightTheme;

	const existingThemes = Array.from(document
		.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][id^="theme-"]'));

	existingThemes.forEach(link => link.disabled = true);
	themeHrefs.forEach(href => {
		let themeLink = existingThemes.find(link => link.href.endsWith(href));
		if (themeLink) {
			themeLink.disabled = false;
		}
		else {
			themeLink = document.createElement('link');
			themeLink.id = 'theme-' + Math.random().toString(36).slice(5);
			themeLink.rel = 'stylesheet';
			themeLink.href = (cfg.env.base + '/' + href).replaceAll(/\/{2,}/g, '/');
			document.head.appendChild(themeLink);
		}
	});

	if (window.top !== window)  {
		// Request an update for all subscribed elements
		subscribers.forEach(ref => {
			const el = ref.deref();
			!el ? subscribers.delete(ref) : el?.requestUpdate();
		});
	}
};


declare global {
	interface Window {
		updateColorSchemeLinks: typeof updateColorSchemeLinks;
		ensureColorScheme:      typeof ensureColorScheme;
		setColorScheme:         typeof setColorScheme;
	}
}


Object.assign(window, {
	updateColorSchemeLinks,
	ensureColorScheme,
	setColorScheme,
});
