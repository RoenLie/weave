import { render } from 'lit';
import { Resolver, type Module } from './module.ts';


export class Router {

	constructor(protected rootModule?: Module) {}
	public element: HTMLElement & { __router: Router };
	public routes = new Map<string, {
		pattern:       URLPattern;
		modulePromise: () => Promise<Module>;
		moduleCache?:  Module;
	}>();

	public route(pattern: string, module: () => Promise<Module>) {
		this.routes.set(pattern, {
			pattern:       new URLPattern(pattern, globalThis.location.host),
			modulePromise: module,
			moduleCache:   undefined,
		});

		console.log(this.routes);


		return this;
	}

	public async start(element: HTMLElement): Promise<void> {
		this.element = Object.assign(element, {
			__router: this,
		});

		const route = '/';
		const module = this.routes.get(route)!;
		if (!module.moduleCache)
			module.moduleCache = await module.modulePromise();

		await module.moduleCache.load();

		const resolver = new Resolver(module.moduleCache);

		const entrypoint = module.moduleCache.entrypoint;
		await entrypoint.enter(resolver);

		render(entrypoint.render(resolver), element);
	}

}
