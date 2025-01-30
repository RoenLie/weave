import { render } from 'lit-html';
import { Signal } from 'signal-polyfill';
import { resolvablePromise as promise, type ResolvablePromise } from '@roenlie/core/async';
import { effect } from './effect.ts';
import type { ReactiveController, ReactiveControllerHost } from './reactive-controller.ts';


export type CSSStyle = CSSStyleSheet | CSSStyleSheet[] | CSSStyle[];


export class CustomElement extends HTMLElement implements ReactiveControllerHost {

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

	public readonly updateComplete: ResolvablePromise<boolean> = promise.resolve(true);
	public readonly hasConnected:   boolean = false;
	public readonly hasRendered:    boolean = false;

	private __unsubEffect?:  () => void;
	private __signalProps:   string[] = [];
	private __changedProps:  Set<string> = new Set();
	private __previousProps: Map<string, any> = new Map();
	private __controllers:   Set<ReactiveController> = new Set();

	protected connectedCallback() {
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

		for (const controller of this.__controllers)
			controller.hostConnected?.();
	}

	protected disconnectedCallback() {
		this.__unsubEffect?.();
		this.__unsubEffect = undefined;
		this.__changedProps.clear();
		this.__previousProps.clear();

		for (const controller of this.__controllers)
			controller.hostDisconnected?.();
	}

	public requestUpdate() {
		for (const prop of this.__signalProps) {
			const value = this[prop as keyof typeof this];

			if (this.__previousProps.get(prop) !== value)
				this.__changedProps.add(prop);

			this.__previousProps.set(prop, value);
		}

		if (!this.updateComplete.done)
			return;

		(this.updateComplete as any) = promise();

		queueMicrotask(() => {
			this.performUpdate();
			this.updateComplete.resolve(true);
		});
	}

	public performUpdate() {
		this.beforeRender(this.__changedProps);

		render(this.render(), this.shadowRoot!, { host: this });

		// We need to wait for the next frame to ensure the DOM has been updated.
		requestAnimationFrame(() => {
			this.afterRender(this.__changedProps);
			this.__changedProps.clear();

			if (!this.hasRendered) {
				(this.hasRendered as boolean) = true;
				this.afterConnected();
			}
		});
	}

	public addController(controller: ReactiveController): void {
		this.__controllers.add(controller);

		if (this.hasConnected)
			controller.hostConnected?.();
	}

	public removeController(controller: ReactiveController): void {
		this.__controllers.delete(controller);
	}

	/** Runs the immediatly after connectedCallback, the first time this component connects. */
	protected firstConnected() {}

	/** Runs after render has completed and dom has been painted after a connectedCallback. */
	protected afterConnected() {}

	/** Runs immediatly before render is performed. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected beforeRender(changedProps: Set<string>) {
		for (const controller of this.__controllers)
			controller.hostUpdate?.();
	}

	/** Runs after render has completed and dom has painted. */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected afterRender(changedProps: Set<string>) {
		for (const controller of this.__controllers)
			controller.hostUpdated?.();
	}

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
