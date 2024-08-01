import { useReflectMetadata } from '@roenlie/reflect-metadata';
import { deepmerge } from 'deepmerge-ts';
import type { interfaces } from 'inversify';
import { Container, id, inject, injectable, named, tagged, unmanaged } from 'inversify';

import type { OverrideFunction } from './plugin.types.ts';

useReflectMetadata();


type PureRecord<T> = T extends CallableFunction ? never : T;


interface PluginBindingToSyntax<T> extends interfaces.BindingToSyntax<T> {
	toHook<C extends (...args: any[]) => void>(value: C): interfaces.BindingWhenOnSyntax<T>;
	toConfig<C extends object>(value: PureRecord<C>): interfaces.BindingWhenOnSyntax<T>;
	toOverride<C extends OverrideFunction<(...args: any[]) => any>>(value: C): interfaces.BindingWhenOnSyntax<T>;
}


export type ServiceIdentifier<T = unknown> = interfaces.ServiceIdentifier<T>;
interface ModuleOptions {
	bind:           <T = unknown>(serviceIdentifier: interfaces.ServiceIdentifier<T>) => PluginBindingToSyntax<T>;
	bindOnce:       <T = unknown>(serviceIdentifier: interfaces.ServiceIdentifier<T>) => interfaces.BindingToSyntax<T> | undefined;
	unbind:         interfaces.Unbind;
	isBound:        interfaces.IsBound;
	isCurrentBound: interfaces.IsBound;
	rebind:         interfaces.Rebind;
	unbindAsync:    interfaces.UnbindAsync;
	onActivation:   interfaces.Container['onActivation'];
	onDeactivation: interfaces.Container['onDeactivation'];
};


export class PluginModule implements interfaces.ContainerModule {

	public id:       number;
	public registry: any; /** Not using inversify default registry func */
	public load:     (methods: ModuleOptions) => void;

	constructor(registry: (options: ModuleOptions) => void) {
		this.id = id();
		this.load = registry;
	}

}


export class PluginContainer extends Container {

	public scopeId:                  string;
	protected moduleMethodsFactory?: PluginModuleMethodsFactory;

	public override load(...modules: PluginModule[]) {
		this.moduleMethodsFactory ??= new PluginModuleMethodsFactory(this);

		for (const currentModule of modules) {
			const methods = this.moduleMethodsFactory.create(currentModule.id);
			currentModule.load(methods);
		}
	}

	public override bind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): PluginBindingToSyntax<T> {
		const bindingTo = super.bind(serviceIdentifier) as PluginBindingToSyntax<T>;

		bindingTo.toConfig = <C extends object>(value: PureRecord<C>) =>
			bindingTo.toConstantValue(value as unknown as T);

		bindingTo.toHook = <C extends (...args: any[]) => void>(value: C) =>
			bindingTo.toConstantValue(value as unknown as T);

		bindingTo.toOverride = <C extends OverrideFunction<(...args: any[]) => any>>(value: C) =>
			bindingTo.toConstantValue(value as unknown as T);

		return bindingTo;
	}

	/**
	 * Binds an identifier only once.
	 * Returns undefined when an identifier is already bound.
	 */
	public bindOnce<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
		if (this.isBound(serviceIdentifier))
			return undefined;

		return this.bind(serviceIdentifier);
	}

	/**
	 * Checks if an identical identifier is bound in the current container and unbinds it
	 * then binds the new value.
	 */
	public override rebind<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
		if (this.isCurrentBound(serviceIdentifier))
			this.unbind(serviceIdentifier);

		return this.bind(serviceIdentifier);
	}

	protected createCacheKey(serviceIdentifier: interfaces.ServiceIdentifier) {
		return serviceIdentifier.toString() + '__cached';
	}

	protected getSetFromCache(
		serviceIdentifier: interfaces.ServiceIdentifier,
		setter: (all: any) => any,
	) {
		const cacheKey = this.createCacheKey(serviceIdentifier);

		if (!this.isBound(cacheKey)) {
			const cfgs = this.getAll(serviceIdentifier);
			const value = setter(cfgs);

			this.bind(cacheKey).toConstantValue(value);

			return value;
		}

		return this.get(cacheKey);
	}

	protected shallowClonedMerge(cfgs: object[]) {
		return Object.assign({}, ...cfgs.map(cfg => clone(cfg)));
	}

	/**
	 * Clears the cached binding for a catalog, usage, config, hook or override.
	 * @returns `true` if a binding was cleared, `false` if no binding was found.
	 */
	public clearCachedBinding(serviceIdentifier: interfaces.ServiceIdentifier) {
		const cacheKey = this.createCacheKey(serviceIdentifier);
		if (this.isBound(cacheKey))
			return this.unbind(cacheKey), true;

		return false;
	}

	/**
	 * Takes a `catalog identifier` and optionally a `usage identifier`.
	 *
	 * Returns a catalog based on a shallow merge of all objects registered
	 * using the same `identifier` and transformed by the default or optional `adapter`.
	 */
	public getCatalog<FromItem extends object, ToItem extends object = FromItem>(
		catalogIdentifier: interfaces.ServiceIdentifier<FromItem>,
		usageIdentifier?: interfaces.ServiceIdentifier<FromItem> | null,
		adapter?: CatalogItemAdapter<FromItem, ToItem>,
	): Cat<ToItem> {
		const catalog = this.getSetFromCache(catalogIdentifier, this.shallowClonedMerge);
		const usage = usageIdentifier
			? this.getSetFromCache(usageIdentifier, this.shallowClonedMerge)
			: null;

		if (!usageIdentifier && !adapter)
			return catalog;

		return transformCatalog(catalog, usage, adapter);
	}

	/**
	 * Takes a `catalog identifier` and optionally a `usage identifier`.
	 *
	 * Returns a list from the catalog based on a shallow merge of all objects registered
	 * using the same `identifier` and transformed by the default or optional `adapter`.
	 *
	 * First time this is retrieved, it will be cached in the current container.
	 */
	public getCatalogList<FromItem extends object, ToItem extends object = FromItem>(
		catalogIdentifier: interfaces.ServiceIdentifier<FromItem>,
		usageIdentifier?: interfaces.ServiceIdentifier<FromItem> | null,
		adapter?: CatalogItemAdapter<FromItem, ToItem>,
	): ToItem[] {
		const catalog = this.getSetFromCache(catalogIdentifier, this.shallowClonedMerge);
		const usage = usageIdentifier
			? this.getSetFromCache(usageIdentifier, this.shallowClonedMerge)
			: null;

		return transformCatalogToList(catalog, usage, adapter);
	}

	/**
	 * Resolves all objects bound to this identifier and performs a deepmerge.
	 *
	 * This returns an object overriden in the order of the current `LoadLocation`.
	 *
	 * First time this is retrieved, it will be cached in the current container.
	 */
	public getConfig<T extends object>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
		return this.getSetFromCache(serviceIdentifier, (cfgs) => deepmerge(...cfgs));
	}

	/**
	 * Resolves all functions bound to this identifier.
	 *
	 * Returns a new function that loops over these functions
	 * and calls each one with the same arguments.
	 *
	 * First time this is retrieved, it will be cached in the current container.
	 */
	public getHook<T extends(...args: any[]) => void>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
		return this.getSetFromCache(
			serviceIdentifier,
			(functions) => ((...args: any[]) => {
				for (const fn of functions)
					fn(...args);
			}),
		);
	}

	/**
	 * Resolves all functions bound to this identifier.
	 *
	 * Returns a new function that mimics the super concept of a class method.
	 *
	 * First time this is retrieved, it will be cached in the current container.
	 */
	public getOverride<T extends(...args: any[]) => void>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T {
		return this.getSetFromCache(
			serviceIdentifier,
			(overrides) => ((...args: any[]) => {
				let func: Fn | undefined = undefined;

				for (const override of overrides)
					func = override(func, ...args);

				return func?.(...args);
			}),
		);
	}

	/**
	 * Returns a proxy which can be used with destructure assignment to perform
	 * multiple PluginContainer.get() calls.
	 */
	public getFrom<T extends Record<string, any>>(record: T | Record<string, string>): {
		[R in keyof T]: T[R];
	} {
		const prox = new Proxy({} as any, {
			get: (_, p: string) => this.get(record[p]!),
		});

		return prox;
	}

	/**
	 * Returns the value of the binding if it exists, otherwise returns undefined.
	 */
	public tryGet<T>(serviceIdentifier: interfaces.ServiceIdentifier<T>): T | undefined {
		if (!this.isBound(serviceIdentifier))
			return undefined;

		return this.get(serviceIdentifier);
	}

}


class PluginModuleMethodsFactory {

	protected static setModuleId(
		bindingToSyntax: interfaces.BindingToSyntax<unknown>,
		moduleId: interfaces.ContainerModuleBase['id'],
	) {
		interface SyntaxBinding { _binding: { moduleId: interfaces.ContainerModuleBase['id'] } }
		(bindingToSyntax as unknown as SyntaxBinding)._binding.moduleId = moduleId;
	}

	constructor(protected plugin: PluginContainer) { }

	protected bindFunction<T>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			const bindingToSyntax = this.plugin.bind(serviceIdentifier);
			PluginModuleMethodsFactory.setModuleId(bindingToSyntax, moduleId);

			return bindingToSyntax as PluginBindingToSyntax<T>;
		};
	}

	protected bindOnceFunction<T>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier<T>) => {
			const bindingToSyntax = this.plugin.bindOnce(serviceIdentifier);
			if (bindingToSyntax)
				PluginModuleMethodsFactory.setModuleId(bindingToSyntax, moduleId);

			return bindingToSyntax as interfaces.BindingToSyntax<T> | undefined;
		};
	}

	protected unbindFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.plugin.unbind(serviceIdentifier);
		};
	}

	protected unbindAsyncFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.plugin.unbindAsync(serviceIdentifier);
		};
	}

	protected isboundFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.plugin.isBound(serviceIdentifier);
		};
	}

	protected isCurrentBoundFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.plugin.isCurrentBound(serviceIdentifier);
		};
	}

	protected rebindFunction<T = unknown>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			const bindingToSyntax = this.plugin.rebind(serviceIdentifier);
			PluginModuleMethodsFactory.setModuleId(bindingToSyntax, moduleId);

			return bindingToSyntax as interfaces.BindingToSyntax<T>;
		};
	}

	protected onActivationFunction<T = unknown>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier<T>, onActivation: interfaces.BindingActivation<T>) => {
			//@ts-expect-error
			this.plugin._moduleActivationStore.addActivation(moduleId, serviceIdentifier, onActivation);
			this.plugin.onActivation<T>(serviceIdentifier, onActivation);
		};
	}

	protected onDeactivationFunction<T = unknown>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier<T>, onDeactivation: interfaces.BindingDeactivation<T>) => {
			//@ts-expect-error
			this.plugin._moduleActivationStore.addDeactivation(moduleId, serviceIdentifier, onDeactivation);
			this.plugin.onDeactivation(serviceIdentifier, onDeactivation);
		};
	}

	public create(mId: interfaces.ContainerModuleBase['id']): ModuleOptions {
		return {
			isBound:        this.isboundFunction(),
			isCurrentBound: this.isCurrentBoundFunction(),
			bind:           this.bindFunction(mId),
			bindOnce:       this.bindOnceFunction(mId),
			rebind:         this.rebindFunction(mId),
			unbind:         this.unbindFunction(),
			unbindAsync:    this.unbindAsyncFunction(),
			onActivation:   this.onActivationFunction(mId),
			onDeactivation: this.onDeactivationFunction(mId),
		};
	}

}


export type { interfaces };
export { inject, injectable, named, tagged, unmanaged };
