import type { Ctor, LocationMapper } from '../app.types.ts';
import type { Adapter } from '../plugin/adapter.ts';


export type ScopeType = AppComponentOptions<string>['scopeType'];


export type ScopeId = (string & Record<never, never>);

export type AdapterBase = Ctor<typeof Adapter> | (abstract new(...args: any) => Adapter);

export type AppComponentOptions<TScope extends ScopeId> = {
	tagname: string;
	/**
	 * The base adapter to be registered in the scope if no other
	 * adapter has been bound to the current adapterId.
	 */
	adapter?: AdapterBase | (() => AdapterBase);
	adapterId?: string | symbol;
} & ({
	scopeType: 'defined';
	scope: TScope;
} | {
	scopeType: 'defined-transient';
	originScope: TScope;
	locationMapper?: LocationMapper;
} |{
	scopeType: 'assigned'
} | {
	scopeType: 'assigned-transient';
	locationMapper?: LocationMapper;
} | {
	scopeType: 'inherit';
})
