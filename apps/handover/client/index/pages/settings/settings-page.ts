import { Adapter, AppComponent, customElement } from '@roenlie/sanguine';
import type { Scopes } from '../../app/definitions.ts';
import { html } from 'lit';


@customElement('ho-settings-page')
export class SettingsPageCmp extends AppComponent<Scopes> {

	constructor() {
		super({
			type:    'defined',
			scope:   s => s.root.settings,
			adapter: SettingsPageAdapter,
		});
	}

}

export class SettingsPageAdapter extends Adapter<SettingsPageCmp> {

	public override render(): unknown {
		return html`
		Settings
		`;
	}

}
