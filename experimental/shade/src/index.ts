/* eslint-disable @typescript-eslint/no-this-alias */
import { LitElement, render, type CSSResult } from 'lit';
import { Directive, directive, type DirectiveResult } from 'lit/directive.js';


let activeElement: HTMLElement | undefined = undefined;


export const createElement = <T extends Record<keyof any, any>>(
	tagname: string,
	create: () => (
		params: T,
	) => unknown,
): DirectiveResult<any> => {
	class _Element extends LitElement {

		protected static __hasInitialized = false;
		public params:     T;
		protected _render: (params: T) => unknown;

		constructor() {
			super();

			activeElement = this;
			this._render = create();
			activeElement = undefined;

			if (!_Element.__hasInitialized) {
				_Element.__hasInitialized = true;
				_Element.elementStyles = _Element.finalizeStyles(_Element.styles);
			}
		}

		protected override render() {
			return this._render(this.params);
		}

	}

	class _Directive extends Directive {

		protected elRef: WeakRef<_Element>;
		public render(
			params: T,
			attrs?: Record<string, string | number | undefined>,
			...children: unknown[]
		): unknown {
			let el = this.elRef && this.elRef.deref();
			if (!el)
				this.elRef = new WeakRef(el = document.createElement(tag) as _Element);

			for (const [ key, value ] of Object.entries(attrs ?? {}))
				el.setAttribute(key, value !== undefined ? String(value) : '');

			el.params = params;
			render(children, el);

			return el;
		}

	}

	const tag = createElement.tagRoot + '-' + tagname;
	customElements.define(tag, _Element);
	const dir = directive(_Directive);

	return dir;
};

createElement.tagRoot = 'sh';


export const useStyles = (styles: CSSResult) => {
	const base = activeElement?.constructor as typeof LitElement;
	base.styles = [ styles ];
};
