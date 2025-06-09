import { type TemplateResult } from 'lit-html';
import type { ClassInfo } from 'lit-html/directives/class-map.js';
import { classMap } from 'lit-html/directives/class-map.js';
import { ref as litRef } from 'lit-html/directives/ref.js';
import type { StyleInfo } from 'lit-html/directives/style-map.js';
import { styleMap } from 'lit-html/directives/style-map.js';

import { isSvgTag } from '../shared/svg-tags.js';
import { eventNameCache } from './event-names.js';
import type { Config, FakeTemplateResult, FakeTemplateStringsArray } from './runtime-types.js';


// Lit wants to receive the same template strings array for the same template.
// We cache these to avoid creating new arrays for every render.
// These are cached by way of TemplateStringsArray reference, which is unique per  call site.
// These are supplied through a build processor that adds a TTL function call to the
// JSX factory functions as the first parameter.
// This is the same caching mechanism that lit-html uses internally.
const templateCache: WeakMap<TemplateStringsArray, FakeTemplateStringsArray> = new WeakMap();


export const createUnCompiledTemplate = (
	cacheKey: TemplateStringsArray,
	type: string,
	config: Config,
): TemplateResult => {
	const { children, ref, styleList, classList, ...props } = config;

	const result = {
		_$litType$: isSvgTag(type) ? 2 : 1,
		strings:    templateCache.get(cacheKey),
		values:     [ '' ],
	} as FakeTemplateResult;

	if (result.strings) {
		if (ref)
			result.values.push(litRef(ref));
		if (styleList)
			result.values.push(styleMap(styleList as StyleInfo));
		if (classList)
			result.values.push(classMap(classList as ClassInfo));

		for (const propName in props) {
			if (Object.hasOwn(props, propName))
				result.values.push(props[propName]);
		}

		result.values.push(children);

		return result;
	}

	result.strings = [ '<' + type + ' ' ] as FakeTemplateStringsArray;
	templateCache.set(cacheKey, result.strings);

	if (ref) {
		result.strings.push(' ');
		result.values.push(litRef(ref));
	}
	if (styleList) {
		result.strings.push(' style=');
		result.values.push(styleMap(styleList as StyleInfo));
	}
	if (classList) {
		result.strings.push(' class=');
		result.values.push(classMap(classList as ClassInfo));
	}

	for (const propName in props) {
		if (!Object.hasOwn(props, propName))
			continue;

		let key = '';

		const cachedEventName = eventNameCache.get(propName);
		if (cachedEventName) {
			// Use the cached event name.
			key = cachedEventName;
		}
		else if (propName.startsWith('on')) {
			// Convert JSX event names to their standard DOM counterpart.
			const eventName = propName.startsWith('on-')
				? '@' + propName.slice(3)
				: '@' + propName.slice(2).toLowerCase();

			eventNameCache.set(propName, eventName);
			key = eventName;
		}
		else if (typeof props[propName] === 'boolean') {
			// Use the boolean attribute syntax.
			key = '?' + propName;
		}
		else if (typeof props[propName] === 'object') {
			// Forward anything that is an object.
			key = '.' + propName;
		}
		else if (typeof props[propName] === 'function') {
			// Forward anything that is a function.
			key = '.' + propName;
		}
		else {
			// Set the attribute on the element.
			key = propName;
		}

		result.strings.push(' ' + key + '=');
		result.values.push(props[propName]);
	};

	result.strings.push('>');
	result.strings.push('</' + type + '>');

	result.strings.raw = Object.freeze([ ...result.strings ]);
	result.strings = Object.freeze(result.strings);

	result.values.push(children);

	return result;
};
