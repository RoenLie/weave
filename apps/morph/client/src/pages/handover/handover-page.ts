import {
	Adapter,
	AegisComponent,
	customElement,
	inject,
} from '@roenlie/lit-aegis';
import { FragmentTable } from '@roenlie/elements/fragment-table';
import { css, html } from 'lit';
import { HandoverRowScrollerCmp } from './handover-row.js';

HandoverRowScrollerCmp.register();
FragmentTable.register();

@customElement('handover-page')
export class HandoverPage extends AegisComponent {
	public static page = true;

	constructor(@inject('should be supported') test: number) {
		super(HandoverPageAdapter);
	}
}

export class HandoverPageAdapter extends Adapter {
	public override render(): unknown {
		return html`
		<m-handover-list></m-handover-list>
		`;
	}

	public static override styles = css`
	:host {
		overflow: hidden;
		display: grid;
	}
	`;
}
