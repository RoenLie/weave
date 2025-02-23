import { render } from 'lit-html';
import { Signal } from 'signal-polyfill';
import { resolvablePromise as promise, type ResolvablePromise } from '@roenlie/core/async';
import { effect } from './effect.ts';
import { DisposingEventHost } from './auto-disposing-event-host.ts';


export class SignalElement extends DisposingEventHost {

	public static tagName: string;
	protected static register(tagName: string): void {
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
		const base = (this.constructor as typeof SignalElement);
		base.defineStyles();
		this.shadowRoot!.adoptedStyleSheets = base.elementStyles;
	}

	public readonly updateComplete: ResolvablePromise<boolean> = promise.resolve(true);
	public readonly hasConnected:   boolean = false;
	public readonly hasUpdated:     boolean = false;

	private __unsubEffect?:  () => void;
	private __signalProps:   string[] = [];
	private __changedProps:  Set<string> = new Set();
	private __previousProps: Map<string, any> = new Map();

	protected connectedCallback(): void {
		const ref = new WeakRef(this);

		// eslint-disable-next-line prefer-arrow-callback
		this.__unsubEffect = effect(function() {
			// We utilize a WeakRef to avoid a potential leak from
			// locking a direct reference to the instance in this scope.
			const self = ref.deref();
			if (!self)
				return;

			self.requestUpdate();
		});

		if (!this.hasConnected) {
			(this.hasConnected as boolean) = true;
			this.firstConnected();
		}
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.__unsubEffect?.();
		this.__unsubEffect = undefined;
		this.__changedProps.clear();
		this.__previousProps.clear();
	}

	public requestUpdate(): Promise<boolean> {
		for (const prop of this.__signalProps) {
			const value = this[prop as keyof typeof this];

			if (this.__previousProps.get(prop) !== value)
				this.__changedProps.add(prop);

			this.__previousProps.set(prop, value);
		}

		if (!this.updateComplete.done)
			return this.updateComplete;

		(this.updateComplete as any) = promise();

		queueMicrotask(() => this.performUpdate());

		return this.updateComplete;
	}

	public performUpdate(): void {
		if (this.updateComplete.done)
			return;

		this.beforeUpdate(this.__changedProps);

		render(this.render(), this.shadowRoot!, { host: this });

		// We need to wait for the next frame to ensure the DOM has been updated.
		requestAnimationFrame(() => {
			this.afterUpdate(this.__changedProps);
			this.__changedProps.clear();

			if (!this.hasUpdated) {
				(this.hasUpdated as boolean) = true;
				this.afterConnected();
			}

			this.updateComplete.resolve(true);
		});
	}

	/** Runs the immediatly after connectedCallback, the first time this component connects. */
	protected firstConnected(): void {}

	/** Runs after render has completed and dom has been painted after a connectedCallback. */
	protected afterConnected(): void {}

	/** Runs immediatly before render is performed. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected beforeUpdate(changedProps: Set<string>): void {}

	/** Runs after render has completed and dom has painted. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected afterUpdate(changedProps: Set<string>): void {}

	/** Return a value which will be rendered into the componens shadowroot. */
	protected render(): unknown { return; }

	public static styles: CSSStyle;

}


export type CSSStyle = CSSStyleSheet | CSSStyleSheet[] | CSSStyle[];
export const css = (strings: TemplateStringsArray, ...values: any[]): CSSStyle => {
	const stylesheet = new EnhancedCSSStyleSheet();
	stylesheet.replaceSync(strings.reduce((acc, str, i) => {
		const value = values[i]!;
		if (value instanceof EnhancedCSSStyleSheet)
			return acc + str + value.text;

		return acc + str + values[i];
	}, ''));

	return stylesheet;
};


export const signal = <C extends SignalElement, V>(
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


export class EnhancedCSSStyleSheet extends CSSStyleSheet {

	public text: string;

	public override replaceSync(text: string): void {
		this.text = text;
		super.replaceSync(text);
	}

}
