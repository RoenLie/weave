export type Maybe<T> = readonly [data: T, error: undefined] | [data: undefined, error: Error];

export const maybe = async <T>(promise: Promise<T>): Promise<Maybe<T>> => {
	try {
		return [ await promise, undefined ];
	}
	catch (error) {
		return [ undefined, error as Error ];
	}
};
