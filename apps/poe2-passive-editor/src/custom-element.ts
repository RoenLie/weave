import { render } from 'lit';
import { effect } from './effect.ts';
import { Signal } from 'signal-polyfill';


export type CSSStyle = CSSStyleSheet | CSSStyleSheet[] | CSSStyle[];


export class CustomElement extends HTMLElement {

	public static tagName: string;
	protected static register(tagName: string) {
		this.tagName = tagName;
		queueMicrotask(() => customElements.define(this.tagName, this));
	}

	protected static elementStyles: CSSStyleSheet[];
	protected static defineStyles() {
		if (this.elementStyles)
			return;

		const chain: any[] = [ this ];
		let proto = Object.getPrototypeOf(this);
		while (proto && proto !== HTMLElement) {
			chain.unshift(proto);
			proto = Object.getPrototypeOf(proto);
		}

		this.elementStyles = [];

		for (const proto of chain) {
			const styles = Array.isArray(proto.styles) ? proto.styles : [ proto.styles ];

			for (const style of styles) {
				if (Array.isArray(style)) {
					const flat = style.flat() as CSSStyleSheet[];
					this.elementStyles.push(...flat);
				}
				else if (style) {
					this.elementStyles.push(style);
				}
			}
		}
	}

	constructor() {
		super();

		this.attachShadow({ mode: 'open' });
		const base = (this.constructor as typeof CustomElement);
		base.defineStyles();
		this.shadowRoot!.adoptedStyleSheets = base.elementStyles;
	}

	private __unsubEffect?:  () => void;
	private __signalProps:   string[] = [];
	private __changedProps:  Set<string> = new Set();
	private __previousProps: Map<string, any> = new Map();

	public connectedCallback() {
		this.__unsubEffect = effect(() => {
			// We can do an untracked read here.
			// But since these are signal props we are probably
			// always interested in changes.
			for (const prop of this.__signalProps) {
				const value = this[prop as keyof this];

				if (this.__previousProps.get(prop) !== value)
					this.__changedProps.add(prop);

				this.__previousProps.set(prop, value);
			}

			this.beforeRender(this.__changedProps);
			render(this.render(), this.shadowRoot!);
			this.afterRender(this.__changedProps);

			this.__changedProps.clear();
		});
	}

	public disconnectedCallback() {
		this.__unsubEffect?.();
		this.__changedProps.clear();
		this.__previousProps.clear();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected beforeRender(changedProps: Set<string>) {}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected afterRender(changedProps: Set<string>) {}

	protected render(): unknown {
		return;
	}

	public static styles: CSSStyle;

}


export const css = (strings: TemplateStringsArray, ...values: any[]): CSSStyle => {
	const stylesheet = new CSSStyleSheet();
	stylesheet.replaceSync(strings.reduce((acc, str, i) => acc + str + values[i], ''));

	return stylesheet;
};


export const signal = <C extends CustomElement, V>(
	target: ClassAccessorDecoratorTarget<C, V>,
	context: ClassAccessorDecoratorContext<C, V>,
): ClassAccessorDecoratorResult<C, V> => {
	const { get } = target;

	context.addInitializer(function() {
		(this as any).__signalProps.push(context.name);
	});

	return {
		get() {
			const signal = (get.call(this) as Signal.State<V>);

			return signal.get();
		},
		set(value: V) {
			const signal = (get.call(this) as Signal.State<V>);
			signal.set(value);
		},
		init(value: any): any {
			return new Signal.State(value);
		},
	};
};
