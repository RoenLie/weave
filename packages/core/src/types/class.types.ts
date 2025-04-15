import type { Interface } from './utility-types.ts';


/**
 * Represents a record that also has a constructor function.\
 * Typically used to represent a class.
 */
export type Ctor<T extends new(...args: any[]) => any = new(...args: any[]) => any> =
	Interface<T> & {
		new(...args: any[]): InstanceType<T>;
		prototype: InstanceType<T>;
	};
