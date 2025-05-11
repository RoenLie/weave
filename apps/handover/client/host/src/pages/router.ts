import { AdapterElement, customElement, provider } from '@roenlie/custom-element/adapter';
import { Router } from '@roenlie/custom-element/router';

import { PluginModule } from '../../../../../../packages/injector/dist/lib/injector';


@provider()
@customElement('ho-router')
export class RouterCmp extends AdapterElement {

	static override modules: readonly PluginModule[] = [
		new PluginModule(({ bind }) => {
			bind('test').constant('Hello world');
		}),
	];

	protected routes = new Router(this, []);

	override connected(): void {
		super.connected();

		console.log(this.inject);

		const result = this.inject.get('test');
		console.log({ result });
	}

}
