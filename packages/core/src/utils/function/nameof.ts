const getPropertyNameInternal = <const T>(
	expression: (instance: T) => any,
	options: {
		isDeep: boolean
	},
) => {
	let propertyThatWasAccessed = '';
	const proxy: T = new Proxy({} as any, {
		get: <const C extends string>(_: any, prop: C) => {
			if (options.isDeep) {
				if (propertyThatWasAccessed)
					propertyThatWasAccessed += '.';

				propertyThatWasAccessed += prop;
			}
			else {
				propertyThatWasAccessed = prop;
			}

			return proxy;
		},
	});
	expression(proxy);

	return propertyThatWasAccessed;
};


export const nameof = <const T>(
	expression: (instance: T) => any, deep = false,
) => getPropertyNameInternal(expression, {
	isDeep: deep,
});
