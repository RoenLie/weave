/**
 * @license
 * Copyright 2021 Google LLC
 * Copyright 2024 Kristoffer Roen-Lie
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { Routes } from './routes.ts';


export type NavigationListener = (event: PopStateEvent | PointerEvent) => void;


export type SearchListener = (
	key: string,
	value: string,
	previousValue: string,
	ev: PopStateEvent | PointerEvent
) => void;


/**
 * Custom implementation of lib-labs/router Router class.
 *
 * Adds the ability to add navigation and search listeners.
 *
 * ---
 * A root-level router that installs global event listeners to intercept
 * navigation.
 *
 * This class extends `Routes` so that it can also have a route configuration.
 *
 * There should only be one Router instance on a page, since the Router
 * installs global event listeners on `window` and `document`.
 *
 * Nested routes should be configured with the `Routes` class.
 */
export class Router extends Routes {

	protected static readonly onSearchChange: NavigationListener = (ev) => {
		const search = new URLSearchParams(location.search);

		const oldSet = new Set(this.previousSearch.keys());
		const newSet = new Set(search.keys());

		const removedKeys = oldSet.difference(newSet);
		const addedKeys = newSet.difference(oldSet);
		const sameKeys = oldSet.intersection(newSet);

		removedKeys.forEach((key) => {
			const previousValue = this.previousSearch.get(key) ?? '';

			for (const listener of this.searchListeners.get(key) ?? [])
				listener(key, '', previousValue, ev);
		});

		addedKeys.forEach((key) => {
			const value = search.get(key) ?? '';

			for (const listener of this.searchListeners.get(key) ?? [])
				listener(key, value, '', ev);
		});

		sameKeys.forEach((key) => {
			const value = search.get(key) ?? '';
			const previousValue = this.previousSearch.get(key) ?? '';

			if (previousValue === value)
				return;

			for (const listener of this.searchListeners.get(key) ?? [])
				listener(key, value, previousValue, ev);
		});

		this.previousSearch = new URLSearchParams(location.search);
	};

	protected static readonly navListeners:    Set<NavigationListener> = new Set([ this.onSearchChange ]);
	protected static readonly searchListeners: Map<string, Set<SearchListener>> = new Map();

	protected static previousSearch: URLSearchParams = new URLSearchParams(location.search);

	static addNavListener(listener: NavigationListener): () => void {
		this.navListeners.add(listener);

		return () => void this.navListeners.delete(listener);
	}

	static removeNavListener(listener: NavigationListener): boolean {
		return this.navListeners.delete(listener);
	}

	static addSearchListener(key: string, listener: SearchListener): () => void {
		const listeners = this.searchListeners.get(key) ??
		this.searchListeners.set(key, new Set()).get(key)!;

		listeners.add(listener);

		return () => void listeners.delete(listener);
	}

	static removeSearchListener(key: string, listener: SearchListener): boolean {
		return !!this.searchListeners.get(key)?.delete(listener);
	}

	override hostConnected(): void {
		super.hostConnected();
		window.addEventListener('click', this.onClick);
		window.addEventListener('popstate', this.onPopState);

		// Kick off routed rendering by going to the current URL
		this.goto(window.location.pathname);
	}

	override hostDisconnected(): void {
		super.hostDisconnected();
		window.removeEventListener('click', this.onClick);
		window.removeEventListener('popstate', this.onPopState);
	}

	protected onClick = async (e: MouseEvent): Promise<void> => {
		const isNonNavigationClick = e.button !== 0
			|| e.metaKey
			|| e.ctrlKey
			|| e.shiftKey;

		if (e.defaultPrevented || isNonNavigationClick)
			return;

		const anchor = e.composedPath()
			.find((n) => n instanceof HTMLAnchorElement);

		if (anchor === undefined
			|| anchor.target !== ''
			|| anchor.hasAttribute('download')
			|| anchor.getAttribute('rel') === 'external')
			return;

		const href = anchor.href;
		if (href === '' || href.startsWith('mailto:'))
			return;

		if (anchor.origin !== location.origin)
			return;

		e.preventDefault();
		if (href !== window.location.href) {
			window.history.pushState({}, '', href);
			await this.goto(anchor.pathname);

			document.head.querySelector('title')!.text =
				anchor.getAttribute('documentTitle') ?? location.pathname.slice(1);

			for (const listener of Router.navListeners)
				listener(e as PopStateEvent | PointerEvent);
		}
	};

	protected onPopState = async (e: PopStateEvent): Promise<void> => {
		await this.goto(window.location.pathname);

		for (const listener of Router.navListeners)
			listener(e as PopStateEvent | PointerEvent);
	};

}
