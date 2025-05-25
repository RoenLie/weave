import { AdapterElement, css, type CSSStyle, customElement, PluginModule, provider } from '@roenlie/custom-element/adapter';
import { Router } from '@roenlie/custom-element/router';
import { classMap, html } from '@roenlie/custom-element/shared';
import { Badge } from '@roenlie/handover-core/components/badge.cmp.ts';

@provider()
@customElement('ho-router')
export class RouterCmp extends AdapterElement {

	static {
		Badge.register();
	}

	static override modules: readonly PluginModule[] = [
		new PluginModule(({ bind }) => {
			bind('test')
				.constant('Hello world')
				.onActivation(instance => {
					console.log('test', instance);

					return instance;
				});
		}),
	];

	protected routes = new Router(this, []);

	override connected(): void {
		super.connected();

		console.log(this.inject);
		const result = this.inject.get('test');
		console.log({ result });
	}

	protected override render(): unknown {
		return html`
		<host class=${ classMap({ test: true }) }></host>
		<div>Hello</div>
		<ho-badge></ho-badge>
		`;
	}

	static override styles: CSSStyle = css`
	host {
		display: none;
	}
	`;

}
