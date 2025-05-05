import { html } from '../../../utilities/template-tag.js';


export interface VoidElement {
	tagName:    string;
	styleUrls:  string | string[];
	scriptUrls: string | string[];
	render(props: Record<keyof any, any>): Promise<string>;
}

type ParamObject<T extends (...args: any) => any> = Parameters<T>[number];


export const voidElement = <T extends VoidElement>(cls: new () => T) => {
	const instance = new cls();
	const { tagName, render } = instance;
	let { styleUrls, scriptUrls } = instance;

	const concatAttrs = (
		attributes: Record<string, string | number | boolean> = {},
	) => {
		let attrs = '';
		const entries = Object.entries(attributes);
		for (const [ key, value ] of entries) {
			if (!value)
				continue;

			if (attrs)
				attrs += ' ';

			if (value === true) {
				attrs += key;
				continue;
			}

			attrs += `${ key }="${ value }"`;
		}

		return attrs;
	};

	styleUrls = Array.isArray(styleUrls) ? styleUrls : [ styleUrls ];
	scriptUrls = Array.isArray(scriptUrls) ? scriptUrls : [ scriptUrls ];

	return (config: {
		attrs?: Record<string, string | number>;
		props?: ParamObject<T['render']>;
	} = {}) => {
		return html`
		<${ tagName } ${ concatAttrs(config.attrs) }>
			<template shadowrootmode="open">
				<void-initializer style="display:none;"></void-initializer>
				<link rel="stylesheet" href="/assets/reset.css">
				${ styleUrls.map(url => html`<link rel="stylesheet" href="${ url }">`) }
				${ scriptUrls.map(url => html`<script type="module" src="${ url }"></script>`) }
				${ render(config.props ?? {}) }
			</template>
		</${ tagName }>
		`;
	};
};
