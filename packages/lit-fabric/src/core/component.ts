import { type CSSResultGroup, LitElement, type PropertyDeclaration, type PropertyValues } from 'lit';


declare class IFabricComponent extends LitElement {

	public static readonly tagName: string;
	public __connectedHooks:    (() => any)[];
	public __disconnectedHooks: (() => any)[];
	public __willUpdateHooks:   ((changedProps: PropertyValues) => any)[];
	public __updateHooks:       ((changedProps: PropertyValues) => any)[];
	public __updatedHooks:      ((changedProps: PropertyValues) => any)[];

}


interface FabricConstructor {
	prototype: IFabricComponent;
	new(): IFabricComponent & { constructor: typeof IFabricComponent; };
}


export type FabricComponent = InstanceType<FabricConstructor>;


export const getCurrentRef = () => component.ref;


export const component = <T extends Record<string, PropertyDeclaration>>(
	tagName: string,
	//construct: (ctor: typeof LitElement) => T,
	create: (element: LitElement) => { render: () => unknown; styles: CSSResultGroup; },
	options?: {
		base?: typeof LitElement;
		mixins?: ((...args: any[]) => any)[];
	},
) => {
	let base = (options?.base ?? LitElement) as unknown as FabricConstructor;
	if (options?.mixins) {
		for (const mixin of options.mixins)
			base = mixin(base);
	}

	return class extends base {

		public static readonly tagName = tagName;
		public static register()  {
			if (!globalThis.customElements.get(tagName))
				globalThis.customElements.define(tagName, this);
		}

		public override __connectedHooks:    (() => any)[] = [];
		public override __disconnectedHooks: (() => any)[] = [];
		public override __willUpdateHooks:   ((changedProps: PropertyValues) => any)[] = [];
		public override __updateHooks:       ((changedProps: PropertyValues) => any)[] = [];
		public override __updatedHooks:      ((changedProps: PropertyValues) => any)[] = [];

		constructor() {
			super();

			component.ref = this;
			const { render, styles } = create(this);
			component.ref = undefined;

			this.render = render;
			if (!this.constructor.elementStyles.length)
				this.constructor.elementStyles = this.constructor.finalizeStyles(styles);
		}


		public override connectedCallback(): void {
			super.connectedCallback();
			for (const hook of this.__connectedHooks)
				hook();
		}

		public override disconnectedCallback(): void {
			super.disconnectedCallback();
			for (const hook of this.__disconnectedHooks)
				hook();
		}

		public override willUpdate(changedProps: PropertyValues): void {
			super.willUpdate(changedProps);
			for (const hook of this.__willUpdateHooks)
				hook(changedProps);
		}

		public override update(changedProps: PropertyValues): void {
			super.update(changedProps);
			for (const hook of this.__updateHooks)
				hook(changedProps);
		}

		public override updated(changedProps: PropertyValues): void {
			super.updated(changedProps);
			for (const hook of this.__updatedHooks)
				hook(changedProps);
		}

	} as unknown as {
		register(): void;
		tagName: string;
	};
};

component.ctorRef = undefined as FabricConstructor | undefined;
component.ref = undefined as InstanceType<FabricConstructor> | undefined;
component.sideEffects = new WeakMap<typeof LitElement, (() => any)[]>();
