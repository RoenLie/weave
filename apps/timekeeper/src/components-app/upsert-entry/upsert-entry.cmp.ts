import { emitEvent } from '@eyeshare/shared';
import { EsButtonCmp, EsDrawerCmp, EsFormCmp, EsFormControlCmp, EsInputCmp, EsLegendCmp, EsTextareaCmp } from '@eyeshare/web-components';
import { MirageElement } from '@roenlie/mirage-utils';
import { html } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { when } from 'lit/directives/when.js';

import { twoWayBind } from '../../helpers/two-way-bind.js';
import type { TimeSubmissionModel } from '../calender-planner/calender-planner.cmp.js';
import { upsertEntryStyle } from './upsert-entry.styles.js';

EsDrawerCmp; EsFormCmp; EsButtonCmp; EsTextareaCmp; EsInputCmp; EsLegendCmp; EsFormControlCmp;
/* ------------------------------------------------- */

@customElement('mi-upsert-entry')
export class MiUpsertEntryCmp extends MirageElement {

	//#region properties
	@property({ type: Object }) public data? = {} as Partial<TimeSubmissionModel>;
	@query('es-drawer') protected drawerQry: EsDrawerCmp;
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	//#endregion


	//#region logic
	public show() {
		this.drawerQry.show();
	}

	public hide() {
		this.drawerQry.hide();
	}

	protected closeDrawer() {
		this.drawerQry.hide();
	}

	protected blockClose(ev: CustomEvent<{source: 'overlay' | 'close-button' | 'keyboard'}>) {
		ev.detail.source === 'overlay' && ev.preventDefault();
	}

	protected handleClickSubmit() {
		if (this.data)
			emitEvent(this, 'mi-calender-entry:submit', { detail: { data: this.data } });
	}

	protected handleClickDelete() {
		if (this.data)
			emitEvent(this, 'mi-calender-entry:delete', { detail: { id: this.data.id! } });
	}

	protected convertDate = {
		in:  (value?: string) => value?.replace(' ', 'T').replace(/:\d+\.\d*/, ''),
		out: (value?: string) => value?.replace('T', ' ') + ':00.000',
	};
	//#endregion


	//#region template
	protected override render() {
		return html`
		<es-drawer
			label=${ this.data?.isNew ? 'Create new entry' : 'Edit entry' }
			placement="end"
			class="drawer-overview"
			@es-request-close=${ this.blockClose }
		>
			<es-form>
				<es-input
					size="medium"
					type="datetime-local"
					label=${ 'Date & Time' }
					.value=${ twoWayBind(this, [ 'data', 'date' ], { convert: this.convertDate }) }
				></es-input>

				<es-input
					size="medium"
					type="number"
					label="Duration"
					.value=${ twoWayBind(this, [ 'data', 'duration' ]) }
				></es-input>

				<es-input
					size="medium"
					label="Title"
					.value=${ twoWayBind(this, [ 'data', 'title' ]) }
				></es-input>

				<es-textarea
				label="Public description"
				.value=${ twoWayBind(this, [ 'data', 'public_comment' ]) }
				></es-textarea>

				<es-textarea
				label="Private description"
				.value=${ twoWayBind(this, [ 'data', 'private_comment' ]) }
				></es-textarea>
			</es-form>

			<es-button
				slot="footer"
				@click=${ this.handleClickSubmit }
			>
				${ this.localize.term(this.data?.isNew ? 'submit' : 'update') }
			</es-button>

			${ when(this.data?.isNew === false, () => html`
			<es-button
				slot="footer"
				@click=${ this.handleClickDelete }
			>
				${ this.localize.term('delete') }
			</es-button>
			`) }

			${ when(this.loading, () => html`
			<mi-loading-indicator></mi-loading-indicator>
			`) }
		</es-drawer>
		`;
	}
	//#endregion


	//#region style
	public static override styles = upsertEntryStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-upsert-entry': MiUpsertEntryCmp;
	}
	interface HTMLElementEventMap {
		'mi-calender-entry:submit': CustomEvent<{data: Partial<TimeSubmissionModel>}>;
		'mi-calender-entry:delete': CustomEvent<{id: string}>;
	}
}
