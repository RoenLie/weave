import { ContainerLoader } from '@roenlie/lit-aegis';
import { LitElement } from 'lit';

import type { SiteConfig } from '../../shared/config.types.js';


const subscribers = new Set<WeakRef<LitElement>>();


export const subscribeToColorChange = (element: LitElement) => {
	subscribers.add(new WeakRef(element));
};


export const updateScheme = () => {
	const cfg = ContainerLoader.get<SiteConfig>('site-config');

	const mode = document.documentElement.getAttribute('color-scheme') ?? 'dark';
	const obj = window.top === window ? cfg.root : cfg.pages;
	const themeHrefs = mode === 'dark'
		? obj.darkTheme
		: obj.lightTheme;

	const existingThemes = document.querySelectorAll('link[rel="stylesheet"][id^="theme-"]');
	existingThemes.forEach(link => link.remove());

	themeHrefs.forEach((href, i) => {
		const themeLink = document.createElement('link');
		themeLink.id = 'theme-' + i;
		themeLink.rel = 'stylesheet';
		themeLink.href = (cfg.env.base + '/' + href).replaceAll(/\/{2,}/g, '/');
		document.head.appendChild(themeLink);
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
		updateColorScheme: typeof updateScheme
	}

	interface Document {
		updateColorScheme: typeof updateScheme
	}
}


Object.assign(window, {
	updateColorScheme: updateScheme,
});
