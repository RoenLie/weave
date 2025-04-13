/** Union of valid search parameter types we know how to convert to a search parameter string. */
export type SearchParamValue = string | number;


/** Configured `SearchParamValue`s. */
export type SearchParamConfig = Record<
	string,
	SearchParamValue | SearchParamValue[] | null | undefined
>;


/** Normalizes the `value` into a search parameter. */
export const normalizeSearchParam = (value: SearchParamValue): string => {
	if (typeof value === 'number')
		return value.toString();
	if (typeof value === 'string')
		return value;

	throw new Error(`Not supported. Value must be a string, number or Temporal date.`,
		{ cause: value });
};


/** Apply the `searchParamConfig` to the `urlSearchParams`. */
export const configureSearchParams = (
	searchParamConfig: SearchParamConfig,
	urlSearchParams: URLSearchParams,
): void => {
	for (const [ key, value ] of Object.entries(searchParamConfig)) {
		if (Array.isArray(value)) {
			for (const val of value) {
				if (val !== undefined && val !== null)
					urlSearchParams.append(key, normalizeSearchParam(val));
				else
					urlSearchParams.delete(key);
			}
		}
		else {
			if (value !== undefined && value !== null)
				urlSearchParams.set(key, normalizeSearchParam(value));
			else
				urlSearchParams.delete(key);
		}
	}
};


/**
 * Create a new URLSearchParams object from the given `searchParamConfig` and `url`.
 *
 * A new URLSearchParams object is created from the `url` and then the `searchParamConfig` is applied.
 *
 * Supplied `searchParamConfig` will override any duplicate search params on the `url`.
 */
export const createSearchParams = (
	searchParamConfig: SearchParamConfig,
	url: URL | URLSearchParams | string,
): URLSearchParams => {
	const urlSearchParams = new URLSearchParams(url instanceof URL ? url.search : url);
	configureSearchParams(searchParamConfig, urlSearchParams);

	return urlSearchParams;
};


/**
 * Updates the current URL with the given `URLSearchParams`.
 *
 * Pushes a new history state and dispatches a `popstate` event.
 */
export const pushSearchState = (
	search: URLSearchParams,
	data?: Record<string, string | number> | null,
	/** if set to `true` does not dispatch a `popstate` event. */
	silent?: boolean,
): void => {
	const url = new URL(globalThis.location.href);
	url.search = search.toString();

	globalThis.history.pushState(data, '', url);

	if (!silent)
		globalThis.dispatchEvent(new PopStateEvent('popstate', { state: data }));
};


/**
 * Replaces the current URL with the given `URLSearchParams`.
 *
 * Replaces the current history state and dispatches a `popstate` event.
 */
export const replaceSearchState = (
	search: URLSearchParams,
	data?: Record<string, string | number> | null,
	/** if set to `true` does not dispatch a `popstate` event. */
	silent?: boolean,
): void => {
	const url = new URL(globalThis.location.href);
	url.search = search.toString();

	globalThis.history.replaceState(data, '', url);

	if (!silent)
		globalThis.dispatchEvent(new PopStateEvent('popstate', { state: data }));
};
