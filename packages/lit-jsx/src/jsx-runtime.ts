import { createCompiledTemplate } from './create-compiled.js';
import type { Config, JSXType } from './runtime-types.js';


// When the fragment only has one child, children is the child object.
const jsxFragment = (fragment: Config): JSX.JSXElement => fragment.children;


const isHTMLElement = (ctor: unknown): ctor is typeof HTMLElement & { tagName?: string; } =>
	typeof ctor === 'function' && ctor.prototype instanceof HTMLElement;


//const logAverage = (() => {
//	let timeout: ReturnType<typeof setTimeout>;
//	let average = 0;
//	let count = 0;

//	return (newValue: number) => {
//		count++;
//		average += (newValue - average) / count;

//		clearTimeout(timeout);
//		timeout = setTimeout(() => {
//			console.log('Average render time:', average + 'ms');
//		}, 500);
//	};
//})();


const jsx = (cacheKey: TemplateStringsArray, type: JSXType, config: Config): JSX.JSXElement | JSX.JSXElement[] => {
	// Either a fragment, functional component or a component class.
	if (typeof type === 'function') {
		if (isHTMLElement(type)) {
			if (!type.tagName) {
				const element = new type();
				type.tagName = element.localName;
			}

			return createCompiledTemplate(cacheKey, type.tagName, config);
		}

		return type(config);
	}

	// Performance measurement.
	//const start = performance.now();
	//const result = createCompiledTemplate(cacheKey, type, config);
	//logAverage(performance.now() - start);
	//return result;

	// Simple JSX tags (<div>, <button>, etc).
	return createCompiledTemplate(cacheKey, type, config);
};


export { jsxFragment as Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
