// nameof property path is stored here for retrieval.
const propertyThatWasAccessed: string[] = [];


// Proxy objects to store the property path.
const proxy: any = new Proxy({} as any, {
	get: <const C extends string>(_: any, prop: C) => {
		propertyThatWasAccessed.push(prop);

		return proxy;
	},
});


export type Nameof<T> = (m: T extends object ? T : any) => any;


/**
 * Returns either the last part of a objects path  \
 * or dotted path if the fullPath flag is set to true.
 */
export const nameof = <const T>(expression: (instance: T) => any): string => {
	propertyThatWasAccessed.length = 0;
	expression(proxy);

	return propertyThatWasAccessed.join('.');
};
