import { createCompiledTemplate } from './create-compiled.js';
import type { Config, FakeCompiledTemplateResult, JSXType } from './runtime-types.js';


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


const jsx = (
	cacheKey: TemplateStringsArray,
	type: JSXType,
	config: Config,
): JSX.JSXElement | JSX.JSXElement[] => {
	//const start = performance.now();

	let result: JSX.JSXElement | JSX.JSXElement[] | FakeCompiledTemplateResult;

	// Either a fragment, functional component or a component class.
	if (typeof type === 'function') {
		if (isHTMLElement(type)) {
			if (!type.tagName) {
				const element = new type();
				type.tagName = element.localName;
			}

			result = createCompiledTemplate(cacheKey, type.tagName, config);
		}
		else {
			result = type(config);
		}
	}
	else {
		// Simple JSX tags (<div>, <button>, etc).
		result = createCompiledTemplate(cacheKey, type, config);
	}

	//logAverage(performance.now() - start);

	return result;
};


export { jsxFragment as Fragment, jsx, jsx as jsxDEV, jsx as jsxs };
