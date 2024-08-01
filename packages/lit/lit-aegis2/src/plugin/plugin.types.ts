import type { PluginModule } from './plugin.ts';


export type LocationId = string & (Record<never, never>);


export interface PluginEntry { module: () => Promise<PluginModule>; }


export type OverrideFunction<T extends (...args: any[]) => any> = (base: T | undefined) => T;
