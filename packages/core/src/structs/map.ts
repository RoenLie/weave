export type InferMapKey<T extends Map<any, any>> = T extends Map<infer K, any> ? K : never;
export type InferMapValue<T extends Map<any, any>> = T extends Map<any, infer V> ? V : never;


export const mapFind = <T extends Map<any, any>>(
	map: T,
	fn: (key: InferMapKey<T>, value: InferMapValue<T>, i: number) => boolean | void,
): [key: InferMapKey<T>, value: InferMapValue<T>] | undefined => {
	let i = 0;
	for (const entry of map) {
		const [ key, value ] = entry;
		if (fn(key, value, i))
			return value;

		i++;
	}
};
