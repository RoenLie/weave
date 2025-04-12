import { id, type interfaces } from 'inversify';

import type { Container } from './container.js';


export type OverrideFunction<T extends (...args: any[]) => any> = (base: T | undefined) => T;


export type PureRecord<T> = T extends CallableFunction ? never : T;


export interface ExtendedBindingToSyntax<T> extends interfaces.BindingToSyntax<T> {
	toHook<C extends (...args: any[]) => void>(value: C): interfaces.BindingWhenOnSyntax<T>;
	toConfig<C extends object>(value: PureRecord<C>): interfaces.BindingWhenOnSyntax<T>;
	toOverride<C extends OverrideFunction<(...args: any[]) => any>>(
		value: C
	): interfaces.BindingWhenOnSyntax<T>;
}


export interface ModuleOptions {
	bind:           <T = unknown>(
		serviceIdentifier: interfaces.ServiceIdentifier<T>
	) => ExtendedBindingToSyntax<T>;
	bindOnce:       <T = unknown>(
		serviceIdentifier: interfaces.ServiceIdentifier<T>
	) => interfaces.BindingToSyntax<T> | undefined;
	unbind:         interfaces.Unbind;
	isBound:        interfaces.IsBound;
	isCurrentBound: interfaces.IsBound;
	rebind:         interfaces.Rebind;
	unbindAsync:    interfaces.UnbindAsync;
	onActivation:   interfaces.Container['onActivation'];
	onDeactivation: interfaces.Container['onDeactivation'];
}


export class ContainerModule implements interfaces.ContainerModule {

	id:       number;
	registry: any; /** Not using inversify default registry func */
	load:     (methods: ModuleOptions) => void;

	constructor(registry: (options: ModuleOptions) => void) {
		this.id = id();
		this.load = registry;
	}

}


export class ContainerModuleMethodsFactory {

	protected static setModuleId(
		bindingToSyntax: interfaces.BindingToSyntax<unknown>,
		moduleId: interfaces.ContainerModuleBase['id'],
	) {
		interface SyntaxBinding { _binding: { moduleId: interfaces.ContainerModuleBase['id']; }; }
		(bindingToSyntax as unknown as SyntaxBinding)._binding.moduleId = moduleId;
	}

	constructor(protected container: Container) { }

	protected bindFunction<T>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			const bindingToSyntax = this.container.bind(serviceIdentifier);
			ContainerModuleMethodsFactory.setModuleId(bindingToSyntax, moduleId);

			return bindingToSyntax as ExtendedBindingToSyntax<T>;
		};
	}

	protected bindOnceFunction<T>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier<T>) => {
			const bindingToSyntax = this.container.bindOnce(serviceIdentifier);
			if (bindingToSyntax)
				ContainerModuleMethodsFactory.setModuleId(bindingToSyntax, moduleId);

			return bindingToSyntax as interfaces.BindingToSyntax<T> | undefined;
		};
	}

	protected unbindFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.container.unbind(serviceIdentifier);
		};
	}

	protected unbindAsyncFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.container.unbindAsync(serviceIdentifier);
		};
	}

	protected isboundFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.container.isBound(serviceIdentifier);
		};
	}

	protected isCurrentBoundFunction() {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			return this.container.isCurrentBound(serviceIdentifier);
		};
	}

	protected rebindFunction<T = unknown>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (serviceIdentifier: interfaces.ServiceIdentifier) => {
			const bindingToSyntax = this.container.rebind(serviceIdentifier);
			ContainerModuleMethodsFactory.setModuleId(bindingToSyntax, moduleId);

			return bindingToSyntax as interfaces.BindingToSyntax<T>;
		};
	}

	protected onActivationFunction<T = unknown>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (
			serviceIdentifier: interfaces.ServiceIdentifier<T>,
			onActivation: interfaces.BindingActivation<T>,
		) => {
			//@ts-expect-error
			this.container._moduleActivationStore
				.addActivation(moduleId, serviceIdentifier, onActivation);

			this.container.onActivation<T>(serviceIdentifier, onActivation);
		};
	}

	protected onDeactivationFunction<T = unknown>(moduleId: interfaces.ContainerModuleBase['id']) {
		return (
			serviceIdentifier: interfaces.ServiceIdentifier<T>,
			onDeactivation: interfaces.BindingDeactivation<T>,
		) => {
			//@ts-expect-error
			this.container._moduleActivationStore
				.addDeactivation(moduleId, serviceIdentifier, onDeactivation);

			this.container.onDeactivation(serviceIdentifier, onDeactivation);
		};
	}

	create(mId: interfaces.ContainerModuleBase['id']): ModuleOptions {
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
