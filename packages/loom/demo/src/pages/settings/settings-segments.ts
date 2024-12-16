import { Adapter, Segment } from '@roenlie/loom';
import { html } from 'lit';


class SettingsAdapter extends Adapter {

	public override render(): unknown {
		return html`
		From SETTINGS adapter
		`;
	}

}

export const segment1 = new Segment(({ bind }) => {
	bind('lo-settings').toAdapter(SettingsAdapter);
});
