import { Adapter, Segment } from '@roenlie/loom';
import { html } from 'lit';


class RootAdapter extends Adapter {

	public override render(): unknown {
		return html`
		Hello from adapter.....

		<slot></slot>
		`;
	}

}

export const segment1 = new Segment(({ bind }) => {
	bind('count').toConstant(0);
	bind('lo-root').toAdapter(RootAdapter);
});
