import { Relay, sleep } from '@eyeshare/shared';
import { maybe } from '@eyeshare/web-components';
import { EsIconCmp } from '@eyeshare/web-components/dist/lib/components/_Core/icon/icon.cmp.js';
import { MirageElement } from '@roenlie/mirage-utils';
import { html } from 'lit';
import { customElement, query } from 'lit/decorators.js';

import { CalenderData } from '../../components-pure/calender-columns/calender-columns.cmp.js';
import { Initialize } from '../../helpers/class.js';
import { getTemporalDateArray } from '../../helpers/get-date-array.js';
import { MiUpsertEntryCmp } from '../upsert-entry/upsert-entry.cmp.js';
import { calenderPlannerStyle } from './calender-planner.styles.js';

EsIconCmp;
/* ------------------------------------------------- */

type DateTimeString = `${ string }-${ string }-${ string } ${ string }:${ string }:${ string }.${ string }`;
class PocketData {

	protected readonly '@collectionId': string;
	protected readonly '@collectionName': string;
	protected readonly '@expand': Record<string, any>;
	public isNew: boolean;
	public id: string;
	public created: DateTimeString;
	public updated: DateTimeString;

}

export class TimeSubmissionModel extends PocketData {

	public date: DateTimeString;
	public user: string;
	public duration: number;
	public title: string;
	public private_comment: string;
	public public_comment: string;

}


/* ------------------------------------------------- */

@customElement('mi-calender-planner')
export class MiCalenderPlannerCmp extends MirageElement {

	//#region properties
	@query('mi-upsert-entry') protected upsertQry: MiUpsertEntryCmp;
	protected selectedDates: Temporal.PlainDate[] = [ Temporal.Now.plainDateISO() ];
	protected data: CalenderData[] = [];
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();

		Mirage.client.realtime.subscribe('timekeeper_time_submission', (data) => {
			const record = data.record as unknown as TimeSubmissionModel;
			const recordDate = record.date.split(' ').at(0)!;

			if (this.selectedDates.some(date => date.toString() === recordDate)) {
				this.loadCalenderData({
					start: this.selectedDates.at(0),
					end:   this.selectedDates.at(-1),
				});
			}
		});

		Relay.subscribe('calender-navigation:select', this.loadCalenderData, { lazy: false });
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		Mirage.client.realtime.unsubscribe('timekeeper_time_submission');
	}
	//#endregion


	//#region logic
	protected loadCalenderData = async (value: RelayChannelMap['calender-navigation:select']) => {
		const { start, end } = value ?? {};

		if (!start) {
			this.selectedDates = [ Temporal.Now.plainDateISO() ];
		}
		else {
			this.selectedDates = getTemporalDateArray(
				Temporal.PlainDate.from(start),
				Temporal.PlainDate.from(end ?? start),
			);
		}

		this.loading = true;
		this.requestUpdate();

		const promise = Mirage.client.records.getFullList(
			'timekeeper_time_submission',
			200 /* batch size */,
			{
				sort:   '-created',
				filter: `user="${ Mirage.auth.user.user.id }"`
					+ ` && (date>="${ this.selectedDates.at(0)!.toString() } 00:00:00"`
					+ ` && date<="${ this.selectedDates.at(-1)!.toString() } 23:59:59")`,
			},
		) as unknown as Promise<TimeSubmissionModel[]>;

		const [ records ] = await Promise.all([ promise, sleep(500) ]);

		this.data = records.map(rec => {
			let datetime = rec.date.split(' ');
			let stringDate = datetime.at(0) as CalenderData['date'];
			let stringTime = datetime.at(1)!.split(':').slice(0, 2).join(':') as CalenderData['time'];

			return {
				id:       rec.id,
				date:     stringDate,
				time:     stringTime,
				duration: rec.duration,
				title:    rec.title,
			};
		});

		this.loading = false;
		this.requestUpdate();
	};

	protected createFullDateString(date: string, time: string) {
		return date + ' ' + time + ':00.000' as TimeSubmissionModel['date'];
	}

	protected handleCalenderRefresh(ev: HTMLElementEventMap['mi-calender-columns:refresh']) {
		const { start, end } = ev.detail;
		this.loadCalenderData({ start, end });
	}

	protected handleColumnsSelectTime(ev: HTMLElementEventMap['mi-calender-columns:select-time']) {
		const { date, time } = ev.detail;

		const editor = this.renderRoot.querySelector('mi-upsert-entry');
		if (!editor)
			return;

		const record = Initialize(TimeSubmissionModel, {
			id:              '-1',
			date:            this.createFullDateString(date, time),
			duration:        1,
			isNew:           true,
			title:           '',
			public_comment:  '',
			private_comment: '',
			user:            Mirage.auth.user.user.id,
		});

		editor.data = record;
		editor.show();
	}

	protected async handleColumnsSelectEvent(ev: HTMLElementEventMap['mi-calender-columns:select-event']) {
		const { id } = ev.detail;

		this.loading = true;
		this.requestUpdate();

		const promise = Mirage.client.records.getOne('timekeeper_time_submission', id);
		const [ record ] = await Promise.all([ promise, sleep(500) ]) as unknown as [TimeSubmissionModel];

		const data = Initialize(TimeSubmissionModel, {
			...record,
			isNew: record.isNew,
		});

		this.upsertQry.data = data;

		this.requestUpdate();
		this.loading = false;

		this.upsertQry.show();
	}

	protected async handleEntryUpdate(ev: HTMLElementEventMap['mi-calender-entry:submit']) {
		const { data } = ev.detail;
		if (data.id === undefined)
			return;

		this.upsertQry.loading = true;
		await sleep(500);

		if (data.id === '-1') {
			data.id = undefined;
			const promise = Mirage.client.records.create('timekeeper_time_submission', data);
			await maybe(promise);
		}
		else {
			const promise = Mirage.client.records.update('timekeeper_time_submission', data.id, data);
			await maybe(promise);
		}

		this.upsertQry.loading = false;
		this.upsertQry.hide();
	}

	protected async handleEntryDelete(ev: HTMLElementEventMap['mi-calender-entry:delete']) {
		const { id } = ev.detail;

		this.upsertQry.loading = true;

		await sleep(500);

		const promise = Mirage.client.records.delete('timekeeper_time_submission', id);
		const [ result, error ] = await maybe(promise);
		result; error;

		this.upsertQry.loading = false;

		this.upsertQry.hide();
	}
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div class="base">
			<mi-calender-columns
				.loading=${ this.loading }
				.dates=${ this.selectedDates }
				.data=${ this.data }
				@mi-calender-columns:refresh=${ this.handleCalenderRefresh }
				@mi-calender-columns:select-time=${ this.handleColumnsSelectTime }
				@mi-calender-columns:select-event=${ this.handleColumnsSelectEvent }
			></mi-calender-columns>

			<mi-upsert-entry
				@mi-calender-entry:submit=${ this.handleEntryUpdate }
				@mi-calender-entry:delete=${ this.handleEntryDelete }
			></mi-upsert-entry>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = calenderPlannerStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-calender-planner': MiCalenderPlannerCmp;
	}
	interface HTMLElementEventMap {

	}
}
