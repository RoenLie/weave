import { arrayChunk, DOMQuery, emitEvent, sleep } from '@eyeshare/shared';
import { throttle, watch } from '@eyeshare/web-components';
import { html, LitElement, PropertyValues } from 'lit';
import { customElement, eventOptions, property, query } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { DAY_NAMES_SHORT, MONTH_NAMES } from '../../helpers/date-constants.js';
import { getTemporalDateArray } from '../../helpers/get-date-array.js';
import { getMultipleBoundingClientRects } from '../../helpers/get-multiple-client-rects.js';
import { infiniteCalenderStyle } from './infinite-calender.styles.js';

/* ------------------------------------------------- */

type SelectedStates = 'first' | 'middle' | 'last' | 'single';

/* ------------------------------------------------- */

/**
 * @event mi-select-date - Emitted when selecting a date.
 */
@customElement('mi-infinite-calender')
export class MiInfiniteCalenderCmp extends LitElement {

	//#region properties
	/** Hides months from being displayed */
	@property({ type: Boolean, attribute: 'hide-months' }) public hideMonths?: boolean;

	/** Hides weeks from being displayed */
	@property({ type: Boolean, attribute: 'hide-weeks' }) public hideWeeks?: boolean;

	/** The date used as the starting point for the calender */
	@property({ type: Object }) public date?: Temporal.PlainDateLike;

	/** Start date in selection */
	@property({ type: Object }) public selectStart?: Temporal.PlainDateLike;

	/** End date in selection */
	@property({ type: Object }) public selectEnd?: Temporal.PlainDateLike;

	protected dateRange: { start: Temporal.PlainDate; end: Temporal.PlainDate; };

	protected selectedRange: Temporal.PlainDate[] = [];

	protected selectedMap: Map<string, SelectedStates> = new Map();

	protected dateArray: Temporal.PlainDate[][] = [];

	protected today = Temporal.Now.plainDateISO();

	@query('.date-list-wrapper', true) protected listWrapperQry: HTMLElement;
	@query('.date-list', true) protected listQry: HTMLElement;
	@query('.base', true) protected baseQry: HTMLElement;
	//#endregion


	//#region controllers
	protected resizeObs = new ResizeObserver(throttle(() => { this.createDateArray(); }, 16));
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
	}

	protected override firstUpdated(props: PropertyValues) {
		super.firstUpdated(props);

		if (this.baseQry)
			this.resizeObs.observe(this.baseQry);
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		this.resizeObs.disconnect();
	}
	//#endregion


	//#region logic
	@watch('date')
	protected onDate() {
		this.date ?? (this.date = Temporal.Now.plainDateISO());
		const date = Temporal.PlainDate.from(this.date);

		this.resetDateRange(date);
	}

	@watch('selectStart')
	@watch('selectEnd')
	protected onSelectDate() {
		if (!this.selectStart) {
			this.selectedRange.length = 0;
			this.selectedMap.clear();
			this.requestUpdate();
			emitEvent(this, 'mi-change-selected-range', { detail: { range: this.selectedRange } });

			return;
		}

		let start = Temporal.PlainDate.from(this.selectStart);
		let end = Temporal.PlainDate.from(this.selectEnd ?? this.selectStart);

		if (!start.equals(end)) {
			if (Temporal.PlainDate.compare(start, end) === 1) {
				let temp = start;
				start = end;
				end = temp;
			}
		}

		this.selectedRange = getTemporalDateArray(start, end);
		this.selectedMap = new Map(this.selectedRange.map((d, i, { length }) => {
			let tuple = [ d.toString(), 'middle' ] as [string, SelectedStates];

			if (i === 0 && length === 1)
				tuple[1] = 'single';
			else if (i === 0)
				tuple[1] = 'first';
			else if (i === length - 1)
				tuple[1] = 'last';

			return tuple;
		}));

		this.requestUpdate();

		emitEvent(this, 'mi-change-selected-range', { detail: { range: this.selectedRange } });
	}

	protected resetDateRange(date: Temporal.PlainDate) {
		const modifiedStart = date.dayOfWeek !== 1
			? date.subtract({ days: date.dayOfWeek - 1 })
			: date;

		const modifiedEnd = date.dayOfWeek !== 7
			? date.add({ days: 7 - (date.dayOfWeek % 7) })
			: date;

		this.dateRange = {
			start: modifiedStart,
			end:   modifiedEnd,
		};

		this.createInitialDateRangeArray();
		this.createDateArray();
	}

	protected createInitialDateRangeArray() {
		const dates = getTemporalDateArray(this.dateRange.start, this.dateRange.end);
		this.dateArray = [ ...arrayChunk(dates, 7) ];
		this.requestUpdate();
	}

	protected async createDateArray(regress?: boolean) {
		if (!this.dateArray.length)
			this.createInitialDateRangeArray();

		await this.updateComplete;

		const [ wrapperRect, listRect ] = getMultipleBoundingClientRects(this.listWrapperQry, this.listQry);

		if ((wrapperRect?.height ?? 99) < 100)
			return;


		const diff = (wrapperRect?.bottom ?? 0) - (listRect?.bottom ?? 0);
		const weekDiff = !this.hideWeeks
			? 1 : this.hideWeeks && !this.hideMonths
				? 4 : this.hideWeeks && this.hideMonths
					? 52 : 1;


		if (diff > 0 && !regress) {
			const from = this.dateRange.end.add({ days: 1 });
			const to = this.dateRange.end.add({ weeks: weekDiff });

			const extraDates = arrayChunk(getTemporalDateArray(from, to), 7);
			this.dateRange.end = to;

			this.dateArray.push(...extraDates);

			this.requestUpdate();
			await this.createDateArray();
		}
		else if (diff < 0) {
			this.dateRange.end = this.dateRange.end.subtract({ weeks: weekDiff });
			this.dateArray.splice(-weekDiff, weekDiff);

			this.requestUpdate();
			await this.createDateArray(true);
		}

		this.requestUpdate();
		await this.updateComplete;
	}

	protected selectDate(start: HTMLElement) {
		const temporal = DOMQuery.getPropsFromPath(
			start,
			[ (node: {temporal?: Temporal.PlainDate}) => !!node.temporal ],
			'temporal',
			{ skipFirst: false, stop: 'first' },
		);

		if (!temporal)
			return;

		emitEvent(this, 'mi-select-date', { detail: { date: temporal } });
	}

	protected async incrementDateRange() {
		const weekDiff = !this.hideWeeks
			? 2 : this.hideWeeks && !this.hideMonths
				? 4 : this.hideWeeks && this.hideMonths
					? 52 : 2;

		const from = this.dateRange.end.add({ days: 1 });
		const to = this.dateRange.end.add({ weeks: weekDiff });

		const extraDates = [ ...arrayChunk(getTemporalDateArray(from, to), 7) ];
		this.dateRange.end = to;
		this.dateRange.start = this.dateRange.start.add({ weeks: weekDiff });

		this.dateArray.splice(0, weekDiff);
		this.dateArray.push(...extraDates);

		await this.createDateArray();

		emitEvent(this, 'mi-change-daterange', { detail: { range: this.dateRange } });
	}

	protected async decrementDateRange() {
		const weekDiff = !this.hideWeeks
			? 2 : this.hideWeeks && !this.hideMonths
				? 4 : this.hideWeeks && this.hideMonths
					? 52 : 2;

		const from = this.dateRange.start.subtract({ weeks: weekDiff });
		const to = this.dateRange.start.subtract({ days: 1 });

		const extraDates = [ ...arrayChunk(getTemporalDateArray(from, to), 7) ];
		this.dateRange.start = from;
		this.dateRange.end = this.dateRange.end.subtract({ weeks: weekDiff });

		this.dateArray.splice(-weekDiff, weekDiff);
		this.dateArray.unshift(...extraDates);

		await this.createDateArray();

		emitEvent(this, 'mi-change-daterange', { detail: { range: this.dateRange } });
	}

	protected getDateClasses(
		date: Temporal.PlainDate,
		week: Temporal.PlainDate[],
		month?: number,
	) {
		if (!month)
			month = week.at(0)!.month;

		let classes = {
			date:     true,
			today:    date.equals(this.today),
			downrank: date.month !== month,
		} as Record<string, boolean>;

		let dateInfo = this.selectedMap.get(date.toString());
		if (dateInfo)
			classes['selected-' + dateInfo] = true;

		return classes;
	}

	protected getYear(dates: Temporal.PlainDate[]) {
		return dates.at(0)?.weekOfYear === 1 ? dates.at(-1)?.year : undefined;
	}

	protected getMonth(dates: Temporal.PlainDate[]) {
		return dates.find(date => {
			/* if it's the first day of the month except for january. */
			if (date.day === 1 && date.month !== 1)
				return true;
			/* if it's within the first 7 days of january and first week of the year. */
			if (date.day < 8 && date.month === 1 && date.weekOfYear === 1)
				return true;
		})?.month;
	}

	protected moveDateRange = throttle((ev: WheelEvent) => {
		if (ev.deltaY < 0) // Scroll up
			this.decrementDateRange();
		else // Scroll down
			this.incrementDateRange();
	}, 16);

	@eventOptions({ passive: true })
	protected handleScroll(ev: WheelEvent) {
		this.moveDateRange(ev);
	}

	protected handleClickDate(ev: Event) {
		this.selectDate(ev.target as HTMLElement);
	}

	protected handleClickToday() {
		this.resetDateRange(this.today);
	}

	protected handleClickIncr() {
		this.incrementDateRange();
	}

	protected handleClickDecr() {
		this.decrementDateRange();
	}

	protected handleClickClear() {
		emitEvent(this, 'mi-clear-selected-daterange', { detail: { range: [] } });
	}
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div part="infinite-calender-base" class="base">
			<div class="header">
				<span class="year-display">
					${ this.dateArray.at(0)?.at(0)?.year }
				</span>
				<span class="actions">
					<es-button
						size="small"
						icon-size="small"
						type="icon"
						icon-name="chevron-left"
						@click=${ this.handleClickDecr }
					></es-button>

					${ when(this.selectedRange.length, () => html`
					<es-button
						size="small"
						icon-size="small"
						type="icon"
						icon-name="x"
						@click=${ this.handleClickClear }
					></es-button>
					`) }

					<es-button
						size="small"
						type="text"
						@click=${ this.handleClickToday }
					>
						Today
					</es-button>

					<es-button
						size="small"
						icon-size="small"
						type="icon"
						icon-name="chevron-right"
						@click=${ this.handleClickIncr }
					></es-button>
				</span>
			</div>

			<div class="weekdays">
				${ map(DAY_NAMES_SHORT, (day, i) => html`
				<div class=${ classMap({ weekday: !!i, weeknum: !i }) }>
					${ day.slice(0, 1) || 'W' }
				</div>
				`) }
			</div>

			<div class="date-list-wrapper">
				<div
					class="date-list"
					@mousewheel=${ this.handleScroll }
					@click=${ this.handleClickDate }
				>
				${ map(this.dateArray, (dates) => {
					const year = this.getYear(dates);
					const month = this.getMonth(dates);

					return html`
						${ when(year, () => html`
						<div class="year">${ year }</div>
						`) }

						${ when(!this.hideMonths && month, () => html`
						<div class="month">${ MONTH_NAMES[month!] }</div>
						`) }

						${ when(!this.hideWeeks, () => html`
						<div class=${ classMap({ week: true }) }>
							<div class="weeknum">${ dates.at(0)?.weekOfYear }</div>

							${ map(dates, (date) => html`
								<div
									class=${ classMap(this.getDateClasses(date, dates, month)) }
									.temporal=${ date }
								>
									${ date.day }
								</div>
							`) }
						</div>
						`) }
					`;
				}) }
				</div>
			</div>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = infiniteCalenderStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-infinite-calender': MiInfiniteCalenderCmp;
	}
	interface HTMLElementEventMap {
		'mi-select-date': CustomEvent<{date: Temporal.PlainDate}>;
		'mi-change-daterange': CustomEvent<{range: {start: Temporal.PlainDate; end: Temporal.PlainDate;}}>;
		'mi-clear-selected-daterange': CustomEvent<{range: []}>;
		'mi-change-selected-range': CustomEvent<{range: Temporal.PlainDate[]}>;
	}
}
