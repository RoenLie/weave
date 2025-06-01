import { AdapterElement, css, type CSSStyle, customElement, PluginModule, provider } from '@roenlie/custom-element/adapter';
import { Router } from '@roenlie/custom-element/router';

import { Badge } from '../components/badge.cmp.tsx';
import { cssreset } from '../styles/css-reset.ts';


@provider()
@customElement('ho-router')
export class RouterCmp extends AdapterElement {

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

		//console.log(this.inject);
		//const result = this.inject.get('test');
		//console.log({ result });
	}

	protected override render(): unknown {
		return (
			<>
				<Badge variant="default" role="link">
					Badge
				</Badge>
				<Badge variant="secondary" role="link">
					Badge
				</Badge>
				<Badge variant="outline" role="link">
					Badge
				</Badge>
				<Badge variant="destructive" role="link">
					Badge
				</Badge>
			</>
		);
	}

	static override styles: CSSStyle = [
		cssreset,
		css`
		:host {
			display: grid;
			height: 100%;
		}
		`,
	];

}
