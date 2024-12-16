import { Adapter, Segment } from '@roenlie/loom';
import { html } from 'lit';


class HomeAdapter extends Adapter {

	public override render(): unknown {
		return html`
		From home adapter
		`;
	}

}

export const segment1 = new Segment(({ bind }) => {
	bind('lo-home').toAdapter(HomeAdapter);
});
