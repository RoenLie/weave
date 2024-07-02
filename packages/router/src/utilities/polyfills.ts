// @ts-ignore: Property 'UrlPattern' does not exist
if (!globalThis.URLPattern)
	(() => import('urlpattern-polyfill'))();
