import type { Ctor } from '../types/class.types.js';


export const findInstanceOf = <TOut extends Ctor<any>>(
	arr: any[], type: TOut,
): InstanceType<TOut> | undefined => arr.find(el => el instanceof type) as any;
