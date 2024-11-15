import { Adapter, AppComponent, customElement } from '@roenlie/sanguine';
import type { Scopes } from '../../app/definitions.ts';
import { html } from 'lit';


@customElement('ho-home-page')
export class HomePageCmp extends AppComponent<Scopes> {

	constructor() {
		super({
			type:    'defined',
			scope:   s => s.root.home,
			adapter: HomePageAdapter,
		});
	}

}

export class HomePageAdapter extends Adapter<HomePageCmp> {

	public override render(): unknown {
		return html`
		Home
		`;
	}

}
