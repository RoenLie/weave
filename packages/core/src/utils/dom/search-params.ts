import type { ObjectOfKeys } from '../../types/record.types.js';


/** Union of valid search parameter types we know how to convert to a search parameter string. */
export type SearchParamValue = string | number;


/** Configured `SearchParamValue`s. */
export type SearchParamConfig = Record<string, SearchParamValue | SearchParamValue[] | null | undefined>;


/** Normalizes the `value` into a search parameter. */
export const normalizeSearchParam = (value: SearchParamValue): string => {
	if (typeof value === 'number')
		return value.toString();
	if (typeof value === 'string')
		return value;

	throw new Error(`Not supported. Value must be a string or number.`, { cause: value });
};


/** Apply the `searchParamConfig` to the `urlSearchParams`. */
export const configureSearchParams = (searchParamConfig: SearchParamConfig, urlSearchParams: URLSearchParams) => {
	for (const [ key, value ] of Object.entries(searchParamConfig)) {
		if (Array.isArray(value)) {
			for (const val of value) {
				if (val !== undefined && val !== null)
					urlSearchParams.append(key, normalizeSearchParam(val));
			}
		}
		else {
			if (value !== undefined && value !== null)
				urlSearchParams.set(key, normalizeSearchParam(value));
		}
	}
};


/**
 * Does the search param of the given `name` exist on the current location?
 */
export const hasSearchParam = (name: string) => {
	const url = new URL(globalThis.location.href);

	return url.searchParams.has(name);
};


/**
 * Get the value of the search param of the given `name` on the current location.
 */
export const getSearchParam = (name: string) => {
	const url = new URL(globalThis.location.href);

	return url.searchParams.get(name);
};


/**
 * Set or delete the search param of the given `name` on the current location.
 */
export const setSearchParam = (name: string, value?: string) => {
	if (!name)
		throw new Error(`Must provide a non-empty search parameter 'name'`);

	const url = new URL(globalThis.location.href);

	if (value === undefined)
		url.searchParams.delete(name);
	else
		url.searchParams.set(name, value);

	if (globalThis.history) {
		globalThis.history.pushState(null, '', url.toString());
		globalThis.dispatchEvent(new PopStateEvent('popstate'));
	}
};


/**
 * Delete the named search params on the current location.
 */
export const deleteSearchParams = (...names: string[]) => {
	const url = new URL(globalThis.location.href);

	if (names.length === 0)
		names = [ ...url.searchParams.keys() ];

	names.forEach(name => {
		url.searchParams.delete(name);
	});

	if (globalThis.history) {
		globalThis.history.pushState(null, '', url.toString());
		globalThis.dispatchEvent(new PopStateEvent('popstate'));
	}
};


/**
 * Get a record of search params on the current location, optionally filtered by providing `names`.
 */
export const getSearchParams = <TNames extends string[]>(...names: TNames): ObjectOfKeys<TNames, string> => {
	const result: Record<string, string> = {};
	const url = new URL(globalThis.location.href);

	if (names.length === 0) {
		url.searchParams.forEach((value, name) => {
			result[name] = value;
		});
	}
	else {
		url.searchParams.forEach((value, name) => {
			if (names.indexOf(name) >= 0)
				result[name] = value;
		});
	}

	return result as ObjectOfKeys<TNames, string>;
};


/**
 * Set and/or delete the provided `params` as search params on the current location.
 */
export const setSearchParams = (params: Record<string, string | undefined>) => {
	const url = new URL(globalThis.location.href);

	Object.entries(params).forEach(([ name, value ]) => {
		if (value === undefined)
			url.searchParams.delete(name);
		else
			url.searchParams.set(name, value);
	});

	if (globalThis.history) {
		globalThis.history.pushState(null, '', url.toString());
		globalThis.dispatchEvent(new PopStateEvent('popstate'));
	}
};


/**
 * Get a record of search params on the current location, optionally filtered by providing `names`.
 */
export const getSearchParamPairs = (...names: string[]): [name: string, value?: string][] => {
	const result: [name: string, value?: string][] = [];
	const url = new URL(globalThis.location.href);

	if (names.length === 0) {
		url.searchParams.forEach((value, name) => {
			result.push([ name, value ]);
		});
	}
	else {
		url.searchParams.forEach((value, name) => {
			if (names.indexOf(name) >= 0)
				result.push([ name, value ]);
		});
	}

	return result;
};


/**
 * Set and/or delete the provided `params` as search params on the current location.
 */
export const setSearchParamPairs = (...params: ([name: string, value?: string])[]) => {
	const url = new URL(globalThis.location.href);

	for (const [ name, value ] of params) {
		if (value === undefined)
			url.searchParams.delete(name);
		else
			url.searchParams.set(name, value);
	}

	if (globalThis.history) {
		globalThis.history.pushState(null, '', url.toString());
		globalThis.dispatchEvent(new PopStateEvent('popstate'));
	}
};
