/**
 * @license
 * Copyright 2021 Google LLC
 * Copyright 2024 Kristoffer Roen-Lie
 * SPDX-License-Identifier: BSD-3-Clause
 */
import { waitForPromises } from '@roenlie/core/async';
import { URLPattern } from 'urlpattern-polyfill/urlpattern';

import type { AdapterElement } from '../adapter/adapter-element.ts';
import type { ReactiveController, ReactiveControllerHost } from '../shared/reactive-controller.ts';


export interface BaseRouteConfig {
	name?:   string | undefined;
	render?: (params: Record<string, string | undefined>) => unknown;
	enter?:  (params: Record<string, string | undefined>) => Promise<boolean> | boolean;
}


/**
 * A RouteConfig that matches against a `path` string. `path` must be a
 * [`URLPattern` compatible pathname pattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern/pathname).
 */
export interface PathRouteConfig extends BaseRouteConfig {
	path: string;
}


/**
 * A RouteConfig that matches against a given [`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
 *
 * While `URLPattern` can match against protocols, hostnames, and ports,
 * routes will only be checked for matches if they're part of the current
 * origin. This means that the pattern is limited to checking `pathname` and
 * `search`.
 */
export interface URLPatternRouteConfig extends BaseRouteConfig {
	pattern: URLPattern;
}


/**
 * A description of a route, which path or pattern to match against, and a
 * render() callback used to render a match to the outlet.
 */
export type RouteConfig = PathRouteConfig | URLPatternRouteConfig;


// A cache of URLPatterns created for PathRouteConfig.
// Rather than converting all given RoutConfigs to URLPatternRouteConfig, this
// lets us make `routes` mutable so users can add new PathRouteConfigs
// dynamically.
const patternCache: WeakMap<PathRouteConfig, URLPattern> = new WeakMap();

const isPatternConfig = (route: RouteConfig): route is URLPatternRouteConfig =>
	(route as URLPatternRouteConfig).pattern !== undefined;

const getPattern = (route: RouteConfig) => {
	if (isPatternConfig(route))
		return route.pattern;

	let pattern = patternCache.get(route);
	if (pattern === undefined)
		patternCache.set(route, (pattern = new URLPattern({ pathname: route.path })));

	return pattern;
};


/**
 * A reactive controller that performs location-based routing using a
 * configuration of URL patterns and associated render callbacks.
 */
export class Routes implements ReactiveController {

	static baseUrl = '';
	static readonly base:              string = ('/' + this.baseUrl).replaceAll(/\/+/g, '/');
	static async waitForRouting(): Promise<void> { await waitForPromises(this.routing); }
	protected static readonly routing: Set<Promise<any>> = new Set();

	constructor(
		protected readonly host: ReactiveControllerHost & (HTMLElement | AdapterElement),
		routes: RouteConfig[] = [],
		options?: { fallback?: BaseRouteConfig; },
	) {
		this.host.addController(this);
		this.routes = routes;
		this.fallback = options?.fallback;
	}

	/*
	 * The currently installed set of routes in precedence order.
	 *
	 * This array is mutable. To dynamically add a new route you can write:
	 *
	 * ```ts
	 * this._routes.routes.push({
	 *   path: '/foo',
	 *   render: () => html`<p>Foo</p>`,
	 * });
	 * ```
	 *
	 * Mutating this property does not trigger any route transitions. If the
	 * changes may result is a different route matching for the current path, you
	 * must instigate a route update with `goto()`.
	 */
	routes: RouteConfig[] = [];

	/**
    * A default fallback route which will always be matched if none of the
    * {@link routes} match. Implicitly matches to the path "/*".
    */
	fallback?: BaseRouteConfig;

	/*
    * The current set of child Routes controllers. These are connected via
    * the routes-connected event.
    */
	protected readonly childRoutes: Routes[] = [];

	protected parentRoutes: Routes | undefined;

	/*
    * State related to the current matching route.
    *
    * We keep this so that consuming code can access current parameters, and so
    * that we can propagate tail matches to child routes if they are added after
    * navigation / matching.
    */
	protected currentPathname: string | undefined;
	protected currentRoute:    RouteConfig | undefined;
	protected currentParams:   Record<string, string | undefined> = {};

	protected previousPathname: string = '';

	/**
    * Callback to call when this controller is disconnected.
    *
    * It's critical to call this immediately in hostDisconnected so that this
    * controller instance doesn't receive a tail match meant for another route.
    */
	protected onDisconnect: (() => void) | undefined;


	/**
    * Returns a URL string of the current route, including parent routes,
    * optionally replacing the local path with `pathname`.
    */
	link(pathname?: string): string {
		if (pathname?.startsWith('/'))
			return pathname;

		if (pathname?.startsWith('.'))
			throw new Error('Not implemented');

		pathname ??= this.currentPathname;

		return (this.parentRoutes?.link() ?? '') + pathname;
	}

	/**
	 * Navigates this routes controller to `pathname`.
	 *
	 * This does not navigate parent routes, so it isn't (yet) a general page
	 * navigation API. It does navigate child routes if pathname matches a
	 * pattern with a tail wildcard pattern (`/*`).
    */
	async goto(pathname: string): Promise<void> {
		if (!pathname.startsWith(Routes.base))
			pathname = Routes.base + pathname;

		if (this.previousPathname === pathname)
			return;

		this.previousPathname = pathname;

		let tailGroup: string | undefined;

		if (this.routes.length === 0 && this.fallback === undefined) {
			// If a routes controller has none of its own routes it acts like it has
			// one route of `/*` so that it passes the whole pathname as a tail
			// match.
			tailGroup = pathname;
			this.currentPathname = '';
			// Simulate a tail group with the whole pathname
			this.currentParams = { 0: tailGroup };
		}
		else {
			const route = this.getRoute(pathname);
			if (route === undefined)
				throw new Error(`No route found for ${ pathname }`);

			const pattern = getPattern(route);
			const result = pattern.exec({ pathname });
			const params = result?.pathname.groups ?? {};
			tailGroup = getTailGroup(params);
			if (typeof route.enter === 'function') {
				const success = await route.enter(params);
				// If enter() returns false, cancel this navigation
				if (success === false)
					return;
			}

			// Only update route state if the enter handler completes successfully
			this.currentRoute = route;
			this.currentParams = params;
			this.currentPathname = tailGroup === undefined
				? pathname
				: pathname.substring(0, pathname.length - tailGroup.length);
		}

		// Propagate the tail match to children
		if (tailGroup !== undefined) {
			for (const childRoutes of this.childRoutes)
				childRoutes.goto(tailGroup);
		}

		this.host.requestUpdate();

		Routes.routing.add(this.host.updateComplete);
		await Routes.waitForRouting();
	}

	/**
    * The result of calling the current route's render() callback.
    */
	outlet(): ReturnType<NonNullable<RouteConfig['render']>> | undefined {
		return this.currentRoute?.render?.(this.currentParams);
	}

	/**
    * The current parsed route parameters.
    */
	get params(): Record<string, string | undefined> {
		return this.currentParams;
	}

	/**
    * Matches `url` against the installed routes and returns the first match.
    */
	protected getRoute(pathname: string): RouteConfig | undefined {
		const matchedRoute = this.routes.find((r) =>
			getPattern(r).test({ pathname: pathname }));
		if (matchedRoute || this.fallback === undefined)
			return matchedRoute;

		if (this.fallback) {
			// The fallback route behaves like it has a "/*" path. This is hidden from
			// the public API but is added here to return a valid RouteConfig.
			return { ...this.fallback, path: '/*' };
		}

		return undefined;
	}

	hostConnected(): void {
		this.host.addEventListener(
			RoutesConnectedEvent.eventName,
			this.onRoutesConnected,
		);
		const event = new RoutesConnectedEvent(this);
		this.host.dispatchEvent(event);
		this.onDisconnect = event.onDisconnect;
	}

	hostDisconnected(): void {
		// When this child routes controller is disconnected because a parent
		// outlet rendered a different template, disconnecting will ensure that
		// this controller doesn't receive a tail match meant for another route.
		this.onDisconnect?.();
		this.parentRoutes = undefined;
	}

	protected onRoutesConnected = (e: RoutesConnectedEvent): void => {
		this.routes.forEach(route => {
			if ('path' in route && !route.path.startsWith(Routes.base))
				route.path = (Routes.base + route.path).replaceAll(/\/+/g, '/');
		});

		// Don't handle the event fired by this routes controller, which we get
		// because we do this.dispatchEvent(...)
		if (e.routes === this)
			return;

		const childRoutes = e.routes;
		this.childRoutes.push(childRoutes);
		childRoutes.parentRoutes = this;

		e.stopImmediatePropagation();
		e.onDisconnect = () => {
			// Remove route from this._childRoutes:
			// `>>> 0` converts -1 to 2**32-1
			this.childRoutes
				?.splice(this.childRoutes.indexOf(childRoutes) >>> 0, 1);
		};

		const tailGroup = getTailGroup(this.currentParams);
		if (tailGroup !== undefined)
			childRoutes.goto(tailGroup);
	};

}


/**
 * Returns the tail of a pathname groups object. This is the match from a
 * wildcard at the end of a pathname pattern, like `/foo/*`
 */
const getTailGroup = (groups: Record<string, string | undefined>) => {
	let tailKey: string | undefined;
	for (const key of Object.keys(groups)) {
		if (/\d+/.test(key) && (tailKey === undefined || key > tailKey!))
			tailKey = key;
	}

	return tailKey && groups[tailKey];
};


/**
 * This event is fired from Routes controllers when their host is connected to
 * announce the child route and potentially connect to a parent routes controller.
 */
export class RoutesConnectedEvent extends Event {

	static readonly eventName = 'routes-connected';
	readonly routes: Routes;
	onDisconnect?:   () => void;

	constructor(routes: Routes) {
		super(RoutesConnectedEvent.eventName, {
			bubbles:    true,
			composed:   true,
			cancelable: false,
		});
		this.routes = routes;
	}

}


declare global {
	interface HTMLElementEventMap {
		[RoutesConnectedEvent.eventName]: RoutesConnectedEvent;
	}
}
