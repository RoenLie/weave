import { AdapterElement, css, type CSSStyle, customElement, PluginModule, provider } from '@roenlie/custom-element/adapter';
import { Router } from '@roenlie/custom-element/router';

import { cssreset } from '../styles/css-reset.ts';
import { BadgePage } from './badge-page.tsx';


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

	protected routes = new Router(this, [
		{
			path:   '/',
			render: () => (<></>),
		},
		{
			path:   '/badge',
			render: () => (<BadgePage />),
		},
		{
			path:   '/rest',
			render: () => (<div {...{ name: '1', role: 'button' }} />),
		},
	]);

	override connected(): void {
		super.connected();

		//console.log(this.inject);
		//const result = this.inject.get('test');
		//console.log({ result });
	}

	protected override render(): unknown {
		return this.routes.outlet();
	}

	static override styles: CSSStyle = [
		cssreset,
		css`
		:host {
			display: grid;
			height: 100dvh;
		}
		`,
	];

}
