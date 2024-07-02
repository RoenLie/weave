import { clone, DOMQuery, emitEvent } from '@eyeshare/shared';
import { watch } from '@eyeshare/web-components';
import { EsIconCmp } from '@eyeshare/web-components/dist/lib/components/_Core/icon/icon.cmp.js';
import { MirageElement } from '@roenlie/mirage-utils';
import { html, PropertyValues } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { when } from 'lit/directives/when.js';

import { DAY_NAMES_SHORT } from '../../helpers/date-constants.js';
import { floorToNearest } from '../../helpers/math.js';
import { stringInsert } from '../../helpers/string.js';
import { calenderColumnsStyle } from './calender-columns.styles.js';

EsIconCmp;

type DateString = `${ string }-${ string }-${ string }`;
type TimeString = `${ string }:${ string }`;

export interface CalenderData {
	id: string;
	date: DateString;
	time: TimeString;
	duration: number;
	title: string;
}

/* ------------------------------------------------- */

@customElement('mi-calender-columns')
export class MiCalenderColumnsCmp extends MirageElement {

	//#region properties
	@property({ type: Array }) public dates = [ new Temporal.PlainDate(2000, 1, 1) ];

	@property({ type: Array }) public data: CalenderData[] = [];

	@query('.base') protected baseQry: HTMLElement;

	protected timezoneName = Temporal.Now.timeZone();

	protected timezoneOffset = this.timezoneName.getOffsetStringFor(Temporal.Now.instant());

	protected timeSegments = Array(24).fill(null).map((_, i) => (i < 10 ? '0' + i : i) + ':00');

	protected focusedDaySegment: Temporal.PlainDate[] | undefined;

	protected dataMap = new Map<string, CalenderData>();

	protected parsedData: ({conflicts: number; xIndex: number;} & CalenderData)[] = [];
	//#endregion


	//#region controllers
	protected resizeCtrl = new ResizeObserver(() => this.requestUpdate());
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
	}

	protected override firstUpdated(props: PropertyValues) {
		super.firstUpdated(props);

		this.resizeCtrl.observe(this.baseQry);
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.resizeCtrl.disconnect();
	}
	//#endregion


	//#region logic
	@watch('data')
	protected onData() {
		const cloned = clone(this.data, 'deep') as typeof this.parsedData;

		let map = new Map<string, CalenderData>();
		cloned.forEach(d => map.set(d.id, d));

		const dataWithConflicts = cloned.map(date => {
			const sameDayEvents = cloned.filter(d => d.date === date.date && d.id !== date.id);
			const [ startA, endA ] = this.getTimeStartEnd(date);
			const conflicts = this.filterDateConflicts(sameDayEvents, startA, endA);
			const conflictsHaveIndex = conflicts.some(date => date.xIndex !== undefined);

			if (conflictsHaveIndex) {
				const highestIndex = conflicts.reduce((a, b) => b.xIndex > a ? b.xIndex : a, 0);
				date.xIndex = highestIndex + 1;
			}
			else {
				date.xIndex = 0;
			}

			date.conflicts = conflicts.length;

			return date;
		});

		this.parsedData = dataWithConflicts;
		this.dataMap = map;
	}

	@watch('dates')
	protected onDates() {
		const focusedData = this.focusedDaySegment
			?.map(day => this.dates.find(d => d.equals(day)))
			.filter((d): d is Temporal.PlainDate => !!d);

		if (!focusedData?.length)
			this.focusedDaySegment = undefined;
		else
			this.focusedDaySegment = focusedData;
	}

	protected getTimeStartEnd(data: CalenderData) {
		const [ hour, min ] = data.time.split(':');
		const time = Temporal.PlainTime.from({ hour: Number(hour), minute: Number(min) });

		const from = parseInt(time.toString().slice(0, 5).replace(':', ''));
		const to = parseInt(time.add({ minutes: data.duration * 60 }).toString().slice(0, 5).replace(':', ''));

		return [ from, to ] as const;
	}

	protected filterDateConflicts<TData extends CalenderData>(
		array: TData[], timeStart: number, timeEnd: number,
	) {
		return array.filter((date) => {
			const [ startB, endB ] = this.getTimeStartEnd(date);

			// https://stackoverflow.com/a/325964
			// checking if two date ranges overlap.
			if ((timeStart <= endB!) && (timeEnd >= startB!))
				return true;
		});
	}

	protected createEventStyle = (date: typeof this.parsedData[0]) => {
		const columnEl = this.renderRoot.querySelector(`[data-date="${ date.date }"]`);
		if (!columnEl)
			return;

		const timeNumber  = parseInt(date.time.replace(':', ''));
		const closestHour = floorToNearest(timeNumber, 100);

		let hourString = String(closestHour);
		hourString     = hourString.length < 4 ? '0' + hourString : hourString;
		hourString     = stringInsert('' + hourString, 2, ':');

		const baseRect    = this.baseQry.getBoundingClientRect();
		const timeStartEl = columnEl.querySelector(`[data-time="${ hourString }"]`);
		if (!timeStartEl)
			return;

		const targetRect   = timeStartEl.getBoundingClientRect();
		const minuteHeight = targetRect.height / 60;
		const height       = (date.duration * 60) * minuteHeight;
		const width        = targetRect.width / (date.conflicts + 1);
		const yOffset      = minuteHeight * (timeNumber - closestHour);
		const xOffset      = date.xIndex * width;
		const top          = Math.round(targetRect.top - baseRect.top + this.baseQry.scrollTop + yOffset);
		const left         = Math.round(targetRect.left - baseRect.left + this.baseQry.scrollLeft + xOffset);

		const style = {
			position: 'absolute',
			top:      top + 'px',
			left:     left + 'px',
			height:   height + 'px',
			width:    width + 'px',
		};

		return style;
	};

	protected handleDateClick(ev: PointerEvent, date: Temporal.PlainDate) {
		if (this.focusedDaySegment || this.dates.length <= 1)
			return;

		this.focusedDaySegment = [ date ];
		this.requestUpdate();
	}

	protected handleClickClearFocusedDay() {
		this.focusedDaySegment = undefined;
		this.requestUpdate();
	}

	protected handleClickRefresh() {
		emitEvent(this, 'mi-calender-columns:refresh',
			{ detail: { start: this.dates.at(0)!, end: this.dates.at(-1)! } });
	}

	protected handleBodyClick(ev: Event) {
		const target = ev.target as HTMLElement;
		const datestr = target.dataset['date']!;
		const timestr = target.dataset['time']!;

		emitEvent(this, 'mi-calender-columns:select-time', {
			detail: {
				date: datestr,
				time: timestr,
			},
		});
	}

	protected handleEventClick(ev: Event) {
		const target = ev.target as HTMLElement;

		const el = DOMQuery.findFirstNode<HTMLElement>(target, node => !!node.dataset['id']);

		emitEvent(this, 'mi-calender-columns:select-event', {
			detail: { id: el!.dataset['id']! },
		});
	}
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div class="base" part="calender-columns-base">
			${ when(this.dates.length, () => html`

			<!-- header -->
			${ html`
			<div class="header-row">
				<div class="actions">
					${ when(this.focusedDaySegment, () => html`
					<es-button
						type="icon"
						icon-name="chevron-left"
						@click=${ this.handleClickClearFocusedDay }
					></es-button>
					`) }
					<es-button
						type="icon"
						icon-name="arrow-clockwise"
						@click=${ this.handleClickRefresh }
					></es-button>
				</div>

				<div class="header-time-column">
					<span>${ this.timezoneName.id }</span>
					<span>${ this.timezoneOffset }</span>
				</div>
				<div class="spacer-column"></div>

				${ map(this.focusedDaySegment ?? this.dates, date => {
					return html`
					<div class="header-column">
						<div class="header-column-day">${ DAY_NAMES_SHORT[date.dayOfWeek] }</div>
						<div class="header-column-date">
							<es-button
								type="text"
								@click=${ (ev: PointerEvent) => this.handleDateClick(ev, date) }
							>${ date.day }
							</es-button>
						</div>
						<div class="header-column-spacer"></div>
					</div>
					`;
				}) }
			</div>
			` }

			<!-- body -->
			${ html`
			<div class="body-row">
				<div class="body-time-column">
					${ map(this.timeSegments, time => {
						return html`
						<div class="body-column-cell">
							<span class="body-column-cell-content">
								${ time }
							</span>
						</div>
						`;
					}) }
				</div>

				<div class="spacer-column">
					${ map(this.timeSegments, () => html`<div></div>`) }
				</div>

				${ map(this.focusedDaySegment ?? this.dates, date => {
					return html`
					<div
						class="body-column"
						data-date=${ date.toString() }
						@click=${ this.handleBodyClick }
					>
					${ map(this.timeSegments, (time, timeI) => html`
						<div
							class="body-column-cell"
							data-date=${ date.toString() }
							data-time=${ time }
							style=${ styleMap({
								'grid-column': '1/2',
								'grid-row':    (timeI + 1) + '/' + (timeI + 2),
							}) }>
						</div>
					`) }
					</div>
					`;
				}) }
			</div>
			` }

			<!-- events -->
			${ map(this.parsedData ?? [], data => {
				return html`
				<div class="event" style=${ styleMap(this.createEventStyle(data) ?? {}) }>
					<div
						class="event__inner"
						data-id=${ data.id }
						@click=${ this.handleEventClick }
					>
						<div class="event__text">
							${ data.title }
						</div>
					</div>
				</div>
				`;
			}) }

			`) }
		</div>

		${ when(this.loading, () => html`
		<mi-loading-indicator></mi-loading-indicator>
		`) }
		`;
	}
	//#endregion


	//#region style
	public static override styles = calenderColumnsStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-calender-columns': MiCalenderColumnsCmp;
	}
	interface HTMLElementEventMap {
		'mi-calender-columns:select-time': CustomEvent<{date: string; time: string}>;
		'mi-calender-columns:select-event': CustomEvent<{id: string}>;
		'mi-calender-columns:refresh': CustomEvent<{
			start: Temporal.PlainDate;
			end: Temporal.PlainDate;
		}>;
	}
}
