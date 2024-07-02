import { Relay } from '@eyeshare/shared';
import { bind, EsButtonCmp, EsButtonGroupCmp, EsCheckboxCmp, EsDividerCmp, EsIconCmp, EsRadioGroupCmp, EsRippleCmp } from '@eyeshare/web-components';
import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';

import { calenderNavigationStyle } from './calender-navigation.styles.js';

EsDividerCmp; EsButtonGroupCmp; EsButtonCmp; EsCheckboxCmp; EsRadioGroupCmp; EsIconCmp; EsRippleCmp;


export type Weekdays = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type Months = '';


@customElement('mi-calender-navigation')
export class MiCalenderNavigationCmp extends LitElement {

	//#region properties
	@state() protected calenderDate = { year: 2022, month: 9, day: 11 };
	@state() protected selectedStart?: Temporal.PlainDateLike;
	@state() protected selectedEnd?: Temporal.PlainDateLike;

	protected selectionMode = {
		single: false,
		range:  false,
		week:   true,
		month:  false,
	};
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
	}
	//#endregion


	//#region logic
	protected handleSelectDate(ev: HTMLElementEventMap['mi-select-date']) {
		const date = ev.detail.date;

		if (this.selectionMode.single)
			this.selectSingleDate(date);
		else if (this.selectionMode.range)
			this.selectDateRange(date);
		else if (this.selectionMode.week)
			this.selectWeek(date);
		else
			this.selectMonth(date);

		Relay.publish('calender-navigation:select', {
			start: this.selectedStart!,
			end:   this.selectedEnd!,
		});
	}

	protected selectSingleDate(date: Temporal.PlainDate) {
		this.selectedStart = date;
		this.selectedEnd = date;
	}

	protected selectDateRange(date: Temporal.PlainDate) {
		if (!this.selectedStart) {
			this.selectedStart = date;
		}
		else if (!this.selectedEnd) {
			if (!date.equals(this.selectedStart))
				this.selectedEnd = date;
		}
		else {
			this.selectedStart = date;
			this.selectedEnd = undefined;
		}
	}

	protected selectWeek(date: Temporal.PlainDate) {
		const modifiedStart = date.dayOfWeek !== 1
			? date.subtract({ days: date.dayOfWeek - 1 })
			: date;

		const modifiedEnd = date.dayOfWeek !== 7
			? date.add({ days: 7 - (date.dayOfWeek % 7) })
			: date;

		this.selectedStart = modifiedStart;
		this.selectedEnd = modifiedEnd;
	}

	protected selectMonth(date: Temporal.PlainDate) {
		const modifiedStart = date.day !== 1
			? date.subtract({ days: date.day - 1 })
			: date;

		const modifiedEnd = modifiedStart.add({ months: 1 }).subtract({ days: 1 });

		this.selectedStart = modifiedStart;
		this.selectedEnd = modifiedEnd;
	}

	protected handleChangeDateRange(_ev: HTMLElementEventMap['mi-change-daterange']) {
		//console.log(_ev);
	}

	protected handleChangeSelectedRange(_ev: HTMLElementEventMap['mi-change-selected-range']) {
		//console.log(_ev);
	}

	protected handleClearDateRange() {
		this.selectedStart = undefined;
		this.selectedEnd = undefined;

		Relay.publish('calender-navigation:select', {
			start: this.selectedStart,
			end:   this.selectedEnd,
		});
	}
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div class="base">
			<mi-infinite-calender
				.date=${ this.calenderDate }
				.selectStart=${ this.selectedStart }
				.selectEnd=${ this.selectedEnd }
				@mi-select-date=${ this.handleSelectDate }
				@mi-change-daterange=${ this.handleChangeDateRange }
				@mi-change-selected-range=${ this.handleChangeSelectedRange }
				@mi-clear-selected-daterange=${ this.handleClearDateRange }
			></mi-infinite-calender>

			<es-divider></es-divider>

			<div class="menu">
				<es-radio-group bare vertical>
					<es-checkbox ${ bind(this, [ 'selectionMode', 'single' ], { path: [ 'checked' ] }) } label-placement="top" label="Single"></es-checkbox>
					<es-checkbox ${ bind(this, [ 'selectionMode', 'range' ], { path: [ 'checked' ] }) } label-placement="top" label="Range"></es-checkbox>
					<es-checkbox ${ bind(this, [ 'selectionMode', 'week' ], { path: [ 'checked' ] }) } label-placement="top" label="Week"></es-checkbox>
					<es-checkbox ${ bind(this, [ 'selectionMode', 'month' ], { path: [ 'checked' ] }) } label-placement="top" label="Month"></es-checkbox>
				</es-radio-group>
			</div>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = calenderNavigationStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-calender-navigation': MiCalenderNavigationCmp;
	}
	interface HTMLElementEventMap {

	}
	interface RelayChannelMap {
		'calender-navigation:select': {
			start: Temporal.PlainDateLike | undefined;
			end: Temporal.PlainDateLike | undefined;
		}
	}
}
