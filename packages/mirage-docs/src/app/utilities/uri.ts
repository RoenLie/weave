export const navigateToUrl = (window: Window, path: string, searchParams?: URLSearchParams) => {
	const search = searchParams?.toString() ?? '';
	let url = path;
	url = search ? url + '?' + search : url;

	window.history.pushState({}, '', url);
	window.dispatchEvent(new PopStateEvent('popstate'));
};

export const updateSearchParams = (window: Window, searchParams: URLSearchParams) => {
	const path = window.location.pathname;

	navigateToUrl(window, path, searchParams);
};
