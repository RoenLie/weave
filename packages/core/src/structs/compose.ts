import type { Ctor } from '../types/class.types.ts';
import type { UnionToIntersection } from '../types/union.types.ts';
import type { ExtractReturnTypes } from '../types/utility-types.ts';


export type Class<TInterface, TBase extends Ctor> = {
	new (...args: any[]): TInterface & InstanceType<TBase>;
	prototype: TInterface & InstanceType<TBase>;
} & TBase;

export type MixinFn<TInt = any, TBase extends Ctor = Ctor> =
	((base: TBase) => Class<TInt, TBase>) & Record<keyof any, any>;

export type MixinResult<T extends MixinFn[], TBase extends Ctor> =
	UnionToIntersection<ExtractReturnTypes<T>[number]> & TBase;

declare global {
	// eslint-disable-next-line no-var
	var Δcompose: boolean | undefined;
}


if (globalThis.Δcompose) {
	console.warn(
		'Duplicate versions of mixwith have been instantiated.',
		'Mixwith will continue to work as expected,',
		'but weakmap related lookup functionality might fail, as there will be multiple sources of truth.',
	);
}
else {
	globalThis.Δcompose = true;
}


/**
 * Holds a reference to each class combination.
 * This reference then has another weakmap which holds a reference to the
 * mixin, with the result of that mixin combination.
 * This allows each combination of mixins to only be performed once,
 * thus reducing class dupliation and hopefully saving some memory.
 */
const classWeakMap: WeakMap<Ctor, WeakMap<MixinFn, Ctor>> = new WeakMap();


/**
 * Returns `true` if the class was directly created from the application of the mixin.
 */
export const isApplicationOf = (
	base: Ctor, mixin: MixinFn<any, any>,
): boolean => !!classWeakMap.get(base)?.has(mixin);


/**
 * Returns `true` if the class has the mixin as part of its prototype chain.
 */
export const hasMixin = (
	initial: Record<keyof any, any> | Ctor, mixin: MixinFn<any, any>,
): boolean => {
	let base = initial as Ctor;

	if (!initial.prototype)
		base = initial.constructor as Ctor;

	while (base != null) {
		if (isApplicationOf(base, mixin))
			return true;

		base = Object.getPrototypeOf(base);
	}

	return false;
};


/**
 * Decorates a mixin function to add typing support.
 */
export const createMixin = <TInt, TBase extends Ctor>(
	mixin: MixinFn<TInt, TBase>,
): MixinFn<TInt, TBase> => mixin;


/**
 * A fluent interface to apply a list of mixins to a superclass.
 *
 * ```typescript
 * class X extends compose(BaseClass).with(A, B, C) {}
 * ```
 *
 * The mixins are applied in order to the superclass, so the prototype chain
 * will be: X->C'->B'->A'->BaseClass.
 *
 * This is purely a convenience function. The above example is equivalent to:
 *
 * ```typescript
 * class X extends C(B(A(BaseClass))) {}
 * ```
 */
export const compose = <TBase extends Ctor>(
	superclass?: TBase,
): MixinBuilder<TBase> => new MixinBuilder<TBase>(superclass);


class MixinBuilder<TBase extends Ctor> {

	constructor(superclass?: TBase) {
		this.supercls = superclass || class {} as TBase;
	}

	private supercls: TBase;

	/**
   * Applies `mixins` in order to the superclass given to `compose()`.
   *
   * @return a subclass of `superclass` with `mixins` applied
   */
	with<M extends MixinFn<any, any>[]>(...mixins: M): MixinResult<M, TBase> {
		return mixins.reduce(
			(c, m) => {
				const classCache = classWeakMap.get(c) ?? classWeakMap
					.set(c, new WeakMap()).get(c)!;

				const mixinCacheResult = classCache.get(m);

				let res: any;
				if (mixinCacheResult) {
					res = mixinCacheResult;
				}
				else {
					res = m(c);
					classCache.set(m, res);
				}

				return res;
			},
			this.supercls,
		) as MixinResult<M, TBase>;
	}

}
