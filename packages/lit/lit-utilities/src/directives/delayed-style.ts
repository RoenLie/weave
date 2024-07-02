import { noChange } from 'lit';
import {
	type AttributePart, Directive, directive,
	type DirectiveParameters, type PartInfo, PartType,
} from 'lit/directive.js';


class DelayedStyleDirective extends Directive {

	constructor(partInfo: PartInfo) {
		super(partInfo);

		if (partInfo.type !== PartType.ELEMENT) {
			throw new Error(
				'`delayedStyle()` can only be used directly in an element.',
			);
		}
	}

	public override update(part: AttributePart, [ styleInfo, delay ]: DirectiveParameters<this>) {
		setTimeout(() => {
			const styleObj = transformElementStyle(part.element);
			const merged = { ...styleObj, ...styleInfo };
			transformElementStyle(part.element, merged);
		}, delay);

		return noChange;
	}

	// eslint-disable-next-line
	public render(styleInfo: StyleRec, delay: number = 0) {
		return noChange;
	}

}


/**
 * A directive that applies styles after a delay.
 */
export const delayedStyle = directive(DelayedStyleDirective);


/**
 * The type of the class that powers this directive. Necessary for naming the
 * directive's return type.
 */
export type { DelayedStyleDirective };


/**
 * Takes in an element and returns the style of that element as an object.
 *
 * Takes in an element and a style object,
 * applies the style object to that element.
 */
export const transformElementStyle = <T extends StyleRec | undefined = undefined>(
	el: HTMLElement, styleObj?: T,
): T extends unknown ? StyleRec : void => {
	if (!styleObj)
		return transformStyle(el.getAttribute('style') || '') as any;

	return el.setAttribute('style', transformStyle(styleObj!)) as any;
};


/**
 * Takes in a record and returns it as a style compatible string.
 *
 * Takes in a style string and returns a record.
 */
export const transformStyle = <T extends StyleShape>(style: T): StringOrRecord<T> => {
	if (typeof style === 'string')
		return stringToStyleObj((style as string)) as any;

	return styleObjToString((style as StyleRec)) as any;
};


const styleObjToString = (style: StyleRec) => {
	return Object.entries(style)
		.reduce((acc, [ key, value ]) => acc + key
			.split(/(?=[A-Z])/)
			.join('-')
			.toLowerCase() + ': ' + value + '; '
		, '').trim();
};


const stringToStyleObj = (style: string) => {
	const camelCased = style.replaceAll(
		/-([a-z])/g, (g: string) => g[1]?.toUpperCase() || '',
	);

	return camelCased.split(';').reduce((prev, att) => {
		const [ key, val ] = att.split(':');
		key && val && (prev[key.trim()] = val.trim());

		return prev;
	}, ({} as StyleRec));
};


type StyleRec = Record<string, string | number>;
type StyleShape = StyleRec | string;
type StringOrRecord<T> = T extends string ? StyleRec : string;
