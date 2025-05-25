import { render } from 'lit';
import { URLPattern } from 'urlpattern-polyfill/urlpattern';

import { type Module, Resolver } from './module.ts';


export interface Route {
	pattern:    URLPattern;
	rawPattern: string;
	module?:    Module;
}


export class Router {

	constructor(
		protected element: HTMLElement,
		protected module: Module,
	) {
		window.addEventListener('popstate', (ev) => {
			// React to popstate changes to navigate routes.
		});

		window.addEventListener('click', (ev) => {
			// React to anchor clicks to navigate routes and prevent default.
		});

		this.initialize();
	}

	protected currentModuleChain: Module[] = [];

	protected async initialize(): Promise<void> {
		this.navigate();
	}

	protected async navigate(path = document.baseURI) {
		let routes: Module['routes'] = this.module.routes;
		const moduleChain: Module[] = [ this.module ];

		let iteration = 99;
		while (iteration-- > 0) {
			const nextRoute = routes.find(route =>
				new URLPattern(route.pattern, document.baseURI).test(path));

			if (!nextRoute)
				break;

			if (!nextRoute.moduleResult)
				nextRoute.moduleResult = await nextRoute.modulePromise();

			moduleChain.push(nextRoute.moduleResult);
			routes = nextRoute.moduleResult.routes;
		}

		let equal = false;
		for (let i = 0; i < moduleChain.length; i++) {
			equal = this.currentModuleChain[i] === moduleChain[i];
			if (!equal)
				break;
		}

		if (equal)
			return;

		this.currentModuleChain = moduleChain;

		let renderTarget = this.element;
		for await (const module of moduleChain) {
			await module.load();

			const resolver = new Resolver(module);

			const entrypoint = module.entrypoint;
			const shouldEnter = await entrypoint.enter(resolver);
			if (shouldEnter === false)
				break;

			const nextTarget = await entrypoint.render(resolver);

			render(nextTarget, renderTarget);

			renderTarget = nextTarget;
		}
	}

}
