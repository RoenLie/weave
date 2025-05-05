export type PropertyType =
	| StringConstructor
	| ObjectConstructor
	| NumberConstructor
	| BooleanConstructor;

export interface AdapterMetadata {
	styles?:            CSSStyleSheet[];
	observedAttributes: string[];
	signalProps:        string[];
	changedProps:       Set<string | symbol>;
	previousProps:      Map<string | symbol, any>;
	propertyMetadata:   Record<string, {
		propName: string;
		type:     PropertyType;
		reflect:  boolean;
	}>;
}
