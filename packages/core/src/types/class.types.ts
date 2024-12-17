import type { Interface } from './data-structure.types.ts';


export type Ctor<T extends new(...args: any[]) => any = new(...args: any[]) => any> =
	Interface<T> & {
		new(...args: any[]): InstanceType<T>;
		prototype: InstanceType<T>
	};
