import './utilities/polyfills.js';

import { animateTo, type ElementAnimation, stopAnimations } from '@roenlie/core/animation';
import { createPromiseResolver } from '@roenlie/core/async';
import { trimPostfix } from '@roenlie/core/string';
import { clone } from '@roenlie/core/structs';

import { RouteHistory } from './route-history-base.js';


type ActionReturn = void | undefined | typeof HTMLElement;

export interface Route {
	path: string;
	name?: string;
	component?: string;
	action?: () => (Promise<ActionReturn> | ActionReturn);
	animation?: { show: ElementAnimation; hide: ElementAnimation };
	redirect?: string;
	children?: (() => Promise<Route[]>) | Route[];
}

interface InternalRoute {
	path: Route['path'][];
	name: Route['name'];
	component: Route['component'][];
	action: Route['action'][];
	animation: Route['animation'][];
	redirect: Route['redirect'][];
	childImport?: (() => Promise<Route[]>);
}

type RouteElement = HTMLElement & { __routeAnimation?: Route['animation']; };


/** This check is used to prevent infinite redirects. */
const MAX_REDIRECTIONS = 100;

/** Holds the animation for a route element. */
const animationCache = new WeakMap<Node, Route['animation']>();


export class Router {

	public params = new Map<string, string>();
	protected outlet: Element;
	protected routes: InternalRoute[];
	protected history: RouteHistory;
	protected baseUrl = location.origin;
	protected updateComplete = Promise.resolve(true);
	protected redirectionCount = 0;

	constructor() { }

	public setHistorian(historian: RouteHistory) {
		this.history = historian;
	}

	public setOutlet(element: Element) {
		this.outlet = element;
		if (element.shadowRoot) {
			const slot = document.createElement('slot');
			element.shadowRoot?.appendChild(slot);
		}

		this.initialize();
	}

	public setRoutes(routes: Route[]) {
		this.routes = this.parseRoutes(routes);

		this.initialize();

		console.log(this.routes);
	}

	public location() {
		return this.history.getRoute();
	}

	public async navigate(route: string) {
		await this.updateComplete;

		const [ promise, resolver ] = createPromiseResolver<boolean>();
		this.updateComplete = promise;

		/* find the best matching route */
		let futureRoute = await this.getMatchingRoute(route);

		/* does the matching route have an async children import? if so,
		import it, add the new routes and get the best matching route again. */
		if (futureRoute?.childImport) {
			const newRoutes = await futureRoute.childImport();
			const insertIndex = this.routes.findIndex(r => r === futureRoute);

			this.parseRoutes(newRoutes, this.routes, futureRoute, insertIndex);
			futureRoute.childImport = undefined;
			futureRoute = await this.getMatchingRoute(route);
		}

		/* if a match was not found, do nothing */
		if (!futureRoute)
			return resolver(true);

		/* Generate the component chain for the matching route */
		const componentChain: RouteElement[] = [];
		for (let i = 0; i < futureRoute.component.length; i++) {
			const component = futureRoute.component[i];

			const actionResult = await futureRoute.action[i]?.();

			let el: RouteElement | undefined;
			if (actionResult)
				el = new actionResult();
			if (!(el instanceof HTMLElement))
				el = document.createElement(component ?? 'div');

			animationCache.set(el, futureRoute.animation[i]);

			componentChain.push(el);
		}

		/* Redirect to the last redirect if there is one. */
		const whereToRedirect = futureRoute.redirect.at(-1);
		if (whereToRedirect !== undefined) {
			if (this.redirectionCount > MAX_REDIRECTIONS)
				throw ('Circular redirections detected.');

			this.redirectionCount++;
			this.navigate(whereToRedirect);

			return resolver(true);
		}

		/* parse any route parameters that are part of target route. */
		const correctedPath = futureRoute.path.join('/').split('/').filter(Boolean);

		const remainingPaths = correctedPath
			.reduce((remaining, path) => remaining.replace(path, ''), route)
			.split('/')
			.filter(Boolean);

		const params = correctedPath
			.filter(p => p.startsWith(':'))
			.map((name, i) => ([ name.slice(1), remainingPaths[i]! ]) as const);

		/* Assign the parsed route parameters to the router param property. */
		this.params = new Map(params);

		/* pre navigation hook, not yet implemented */
		await this.beforeNavigate();

		/* Do the actual navigation and replacement of nodes. */
		this.history.setRoute(route);
		this.replaceRouteNodes(componentChain, this.outlet);

		/* post navigation hook, not yet implemented */
		await this.afterNavigate();

		/* Resolve the blocking promise and reset redirection count. */
		resolver(true);
		this.redirectionCount = 0;

		return route;
	}

	protected initialize() {
		if (!this.routes || !this.outlet || !this.history)
			return;

		this.history.clearHistory();
		this.navigate(this.location());
	}

	protected async beforeNavigate() {
		//console.log('before set route');
	}

	protected async afterNavigate() {
		//console.log('after set route');
	}

	protected parseRoutes(
		routes: Route[] | undefined,
		parsedRoutes: InternalRoute[] = [],
		route: InternalRoute = {
			path:      [],
			name:      undefined,
			component: [],
			action:    [],
			animation: [],
			redirect:  [],
		},
		index?: number,
	) {
		if (!routes?.length)
			return parsedRoutes;

		routes.forEach(r => {
			const clonedRoute = clone(route);

			clonedRoute.name = r.name;
			clonedRoute.path.push(trimPostfix(r.path, '/'));
			clonedRoute.redirect.push(r.redirect);
			clonedRoute.component.push(r.component);
			clonedRoute.action.push(r.action);
			clonedRoute.animation.push(r.animation);

			if (index !== undefined) {
				parsedRoutes.splice(index, 0, clonedRoute);
				index++;
			}
			else {
				parsedRoutes.push(clonedRoute);
			}

			if (r.children instanceof Function)
				clonedRoute.childImport = r.children;
			else
				this.parseRoutes(r.children, parsedRoutes, clonedRoute, index);
		});

		return parsedRoutes;
	}

	protected async getMatchingRoute(route: string): Promise<InternalRoute | undefined> {
		// First find routes that start with the path and that have async imports.
		const possibleAsyncRoutes = this.routes.filter(r => {
			const path = r.path.join('/').replaceAll('//', '/');

			return route.startsWith(path) && r.childImport;
		});

		// Expand the possible paths if they have async import childpaths.
		if (possibleAsyncRoutes.length) {
			const possRoute = possibleAsyncRoutes.at(0)!;
			const newRoutes = await possRoute.childImport!();
			possRoute.childImport = undefined;

			const insertIndex = this.routes.findIndex(r => r === possRoute);
			this.parseRoutes(newRoutes, this.routes, possRoute, insertIndex);

			return await this.getMatchingRoute(route);
		}

		// Return the best matching route.
		return this.routes.find(r => {
			const pattern = new URLPattern({
				pathname: r.path.join('/').replaceAll('//', '/'),
				baseURL:  this.baseUrl,
			});

			return pattern.test(route, this.baseUrl);
		});
	}

	protected async replaceRouteNodes(elements: RouteElement[], parent: Element, depth = 0) {
		const nodeToInsert = elements[depth];
		if (!nodeToInsert)
			return await this.reversedRouteNodeRemoval(parent as RouteElement);

		const childElements = Array.from(parent.children) as RouteElement[];
		const invalidNodes = childElements.filter(el => el.tagName !== nodeToInsert?.tagName);
		for (const el of invalidNodes)
			await this.reversedRouteNodeRemoval(el, true);

		depth ++;

		if (parent.firstElementChild) {
			await this.replaceRouteNodes(elements, parent.firstElementChild, depth);
		}
		else {
			parent.insertAdjacentElement('afterbegin', nodeToInsert);

			const animation = animationCache.get(nodeToInsert)?.show;
			if (animation) {
				await stopAnimations(nodeToInsert);
				await animateTo(nodeToInsert, animation.keyframes, animation.options);
			}

			await this.replaceRouteNodes(elements, nodeToInsert, depth);
		}
	}

	protected async removeRouteElement(el: RouteElement) {
		const anim = animationCache.get(el)?.hide;
		if (anim) {
			await stopAnimations(el);
			await animateTo(el, anim.keyframes, anim.options);
		}

		el.remove();
		animationCache.delete(el);
	}

	protected async reversedRouteNodeRemoval(node: RouteElement, removeParent?: boolean) {
		while (node.firstChild) {
			const child = node.firstChild as RouteElement;
			await this.reversedRouteNodeRemoval(child);
			await this.removeRouteElement(child);
		}

		if (removeParent)
			await this.removeRouteElement(node);
	}

}
