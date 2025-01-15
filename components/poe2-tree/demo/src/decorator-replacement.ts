import { LitElement, type PropertyDeclaration } from 'lit';
import {
	property as litProperty, state as litState,
	query as litQuery, queryAll as litQueryAll,
} from 'lit/decorators.js';
import { nameof } from '@roenlie/core/function';


export const property = <T extends typeof LitElement, Val>(
	cls: T,
	target: (m: InstanceType<T>) => Val,
	type: PropertyDeclaration<Val>['type'],
	defaultValue?: NoInfer<Val>,
	options?: Omit<PropertyDeclaration<Val>, 'type'>,
) => {
	litProperty({ ...options, type })(cls.prototype, nameof(target));
	//Object.defineProperty(cls.prototype, nameof(target), {
	//	value: defaultValue,
	//});
};


export const state = <T extends typeof LitElement, Val>(
	cls: T,
	target: (m: InstanceType<T>) => Val,
	defaultValue?: NoInfer<Val>,
) => {
	litState()(cls.prototype, nameof(target));
	//Object.defineProperty(cls.prototype, nameof(target), {
	//	value: defaultValue,
	//});
};


export const query = <T extends typeof LitElement>(
	cls: T,
	target: (m: InstanceType<T>) => any,
	...args: Parameters<typeof litQuery>
) => {
	// This tricks lit into thinking it's a legacy decorator.
	(Reflect as any).decorate ??= true;

	litQuery(...args)(cls.prototype, nameof(target));
};


export const queryAll = <T extends typeof LitElement>(
	cls: T,
	target: (m: InstanceType<T>) => any,
	...args: Parameters<typeof litQueryAll>
) => {
	// This tricks lit into thinking it's a legacy decorator.
	(Reflect as any).decorate ??= true;

	return litQueryAll(...args)(cls.prototype, nameof(target));
};
