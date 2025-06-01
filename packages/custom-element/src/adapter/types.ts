import type { PluginContainer } from '@roenlie/injector';

export type PropertyType =
	| StringConstructor
	| ObjectConstructor
	| NumberConstructor
	| BooleanConstructor;

export interface AdapterMetadata {
	styles?:            CSSStyleSheet[];
	pluginContainer?:   PluginContainer;
	observedAttributes: string[];
	signalProps:        string[];
	changedProps:       Map<keyof any, any>;
	previousProps:      Map<keyof any, any>;
	propertyMetadata:   Record<string, {
		propName: string;
		type:     PropertyType;
		reflect:  boolean;
	}>;
}
