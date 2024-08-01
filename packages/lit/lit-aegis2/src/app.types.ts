import type { IPluginData } from './data-structures.ts';
import type { ElementTree } from './scope/element-tree.ts';
import type { ScopeTree } from './scope/scope-tree.ts';


export type LocationMapper = () => LocationResult;


export interface LocationResult { from: string[]; to: string[] }


export type ScopeHierarchy<T extends object> = Extract<PathOf<T>, string>;


type ComputedFlat<A> = { [K in keyof A]: A[K]; } & unknown;
export type Ctor<T extends new(...args: any[]) => any> = ComputedFlat<T> & {
	new(...args: any[]): InstanceType<T>;
	prototype: InstanceType<T>
};


export interface $__Debug_Aegis {
	pluginData:  IPluginData;
	elementTree: ElementTree;
	scopeTree:   ScopeTree;
};
