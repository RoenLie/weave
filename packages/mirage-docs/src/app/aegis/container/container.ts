import type { Fn } from '@roenlie/core/types';
import { deepmerge } from 'deepmerge-ts';
import { Container as iContainer, type interfaces } from 'inversify';

import {
	type ContainerModule,
	ContainerModuleMethodsFactory,
	type ExtendedBindingToSyntax,
	type OverrideFunction,
	type PureRecord,
} from './container-module.js';


export class Container extends iContainer {

	protected moduleMethodsFactory?: ContainerModuleMethodsFactory;

	public override load(...modules: ContainerModule[]) {
		this.moduleMethodsFactory ??= new ContainerModuleMethodsFactory(this);

		for (const currentModule of modules) {
			const methods = this.moduleMethodsFactory.create(currentModule.id);
			currentModule.load(methods);
		}
	}

	public override bind<T>(
		serviceIdentifier: interfaces.ServiceIdentifier<T>,
	): ExtendedBindingToSyntax<T> {
		const bindingTo = super.bind(serviceIdentifier) as ExtendedBindingToSyntax<T>;

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

	/**
	 * Resolves all objects bound to this identifier and performs a deepmerge.
	 * This returns an object overriden in the order of the current `LoadLocation`.
	 */
	public getConfig<T extends object>(serviceIdentifier: interfaces.ServiceIdentifier<T>) {
		const cfgs = this.getAll<T>(serviceIdentifier);

		return deepmerge(...cfgs) as T;
	}

	/**
	 * Resolves all functions bound to this identifier.
	 * Returns a new function that loops over these functions
	 * and calls each one with the same arguments.
	 */
	public getHook<T extends(...args: any[]) => void>(
		serviceIdentifier: interfaces.ServiceIdentifier<T>,
	) {
		const functions = this.getAll(serviceIdentifier);

		return ((...args: any[]) => {
			for (const fn of functions)
				fn(...args);
		}) as T;
	}

	/**
	 * Resolves all functions bound to this identifier
	 * Returns a new function that mimics the super concept of a class method.
	 */
	public getOverride<T extends(...args: any[]) => void>(
		serviceIdentifier: interfaces.ServiceIdentifier<T>,
	) {
		const overrides = this.getAll<(base: Fn | undefined, ...args: any[]) => Fn>(
			serviceIdentifier as any,
		);

		return ((...args: any[]) => {
			let func: Fn | undefined = undefined;

			for (const override of overrides)
				func = override(func, ...args);

			return func?.(...args);
		}) as T;
	}

}
