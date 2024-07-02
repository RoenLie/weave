import { customElement, MimicElement } from '@roenlie/mimic-lit/element';
import { type Context, type Route, Router } from '@vaadin/router';
import { css } from 'lit';
import { property } from 'lit/decorators.js';


export type { Route };


@customElement('m-router')
export class AppRouterCmp extends MimicElement {

	/** Loops through the exports from a dynamic import and check for a component that is both a MimicElement
	 * and marked with the public static property of `page` set to `true`.
	 * Uses this exported component as the component for the given route.
	 */
	public static routeComponent<T extends() => Promise<Record<string, any>>>(importFn: T) {
		return async (context: Context) => {
			const module = await importFn();

			for (const exprt of Object.values<Record<keyof any, any>>(module)) {
				const hasRequiredProps = [ 'page', 'register', 'tagName' ]
					.every(prop => prop in exprt);

				if (hasRequiredProps) {
					const _exprt = exprt as typeof MimicElement;

					context.route.component = _exprt.tagName;
					_exprt.register();
				}
			}
		};
	}

	@property({ type: Array }) public routes: Route[] = [];
	protected router = new Router();

	public override connectedCallback() {
		super.connectedCallback();

		this.router.setOutlet(this.shadowRoot);
		this.router.setRoutes(this.routes);
	}

	public static override styles = [
		css`
		:host {
			display: contents;
		}
		`,
	];

}
