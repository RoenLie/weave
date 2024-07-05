import '@roenlie/elements/button';
import '@roenlie/elements/icon';
import '@roenlie/elements/text';

import { component } from '@roenlie/lit-fabric/core';
import { useConnected, useDisconnected, useState } from '@roenlie/lit-fabric/hooks';
import { domId } from '@roenlie/core/dom';
import { accurateTimer } from '@roenlie/core/timing';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, nothing } from 'lit';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';


interface Lap {
	id: string;
	time: Date;
	total: Date;
	fastest: boolean;
	slowest: boolean;
}


export const StopwatchPage = component('clk-stopwatch-page', element => {
	const [ time ] = useState('time', new Date(0, 0, 0, 0, 0, 0, 0));
	const [ currentTime, setCurrentTime ] = useState('currentTime', new Date(time.value));
	const [ laps, setLaps ] = useState<Lap[]>('laps', []);
	const [ tableHeight, setTableHeight ] = useState('tableHeight', 0);

	let cancelTimer: undefined | (() => void);

	const resizeObs = new ResizeObserver(() => {
		const container = element.renderRoot.querySelector<HTMLElement>('.laps');
		setTableHeight(container?.offsetHeight ?? 0);
	});

	const handleToggleTime = () => {
		if (cancelTimer) {
			cancelTimer();
			cancelTimer = undefined;
		}
		else {
			cancelTimer = accurateTimer(() => {
				currentTime.value.setTime(currentTime.value.getTime() + 100);
				element.requestUpdate();
			}, 100).cancel;
		}

		element.requestUpdate();
	};

	const handleLap = () => {
		const previous = laps.value.at(-1)?.total ?? new Date(0, 0, 0);
		const timeDiff = Math.abs(previous.getTime()) - Math.abs(currentTime.value.getTime());
		const time = new Date(0, 0, 0);
		time.setTime(time.getTime() + timeDiff);

		setLaps([
			...laps.value,
			{
				id:      domId(),
				time,
				total:   new Date(currentTime.value),
				fastest: false,
				slowest: false,
			},
		]);

		laps.value.forEach(lap => {
			lap.fastest = false; lap.slowest = false;
		});

		const indicators = laps.value.reduce((prev, cur) => {
			if (!prev.fastest)
				prev.fastest = cur;
			if (!prev.slowest)
				prev.slowest = cur;

			if (prev.fastest.time.getTime() > cur.time.getTime())
				prev.fastest = cur;
			if (prev.slowest.time.getTime() < cur.time.getTime())
				prev.slowest = cur;

			return prev;
		}, {} as { fastest: Lap; slowest: Lap; });

		indicators.fastest.fastest = true;
		indicators.slowest.slowest = true;
	};

	const handleReset = () => {
		setCurrentTime(new Date(time.value));
		setLaps([]);
	};

	const parseTime = (time: Date) => {
		return parseSegment(time.getHours()) +
			':' + parseSegment(time.getMinutes()) +
			':' + parseSegment(time.getSeconds()) +
			'.' + parseSegment(time.getMilliseconds());
	};

	const parseSegment = (number: number) => {
		const length = number.toString().length;
		const strNum = '' + number;

		if (length < 2)
			return '0' + strNum;
		if (length > 2)
			return strNum.slice(0, 2);

		return strNum;
	};

	const timeTemplate = () => {
		return html`
		<div class="block">
			<mm-text type="display-large">
				${ parseSegment(currentTime.value.getHours()) }
			</mm-text>
			<mm-text type="display-small">hr</mm-text>
		</div>

		<mm-text type="display-large">:</mm-text>

		<div class="block">
			<mm-text type="display-large">
				${ parseSegment(currentTime.value.getMinutes()) }
			</mm-text>
			<mm-text type="display-small">min</mm-text>
		</div>

		<mm-text type="display-large">:</mm-text>

		<div class="block">
			<mm-text type="display-large">
				${ parseSegment(currentTime.value.getSeconds()) }
			</mm-text>
			<mm-text type="display-small">sec</mm-text>
		</div>

		<mm-text type="display-large">.</mm-text>

		<div class="block">
			<mm-text type="display-medium">
				${ parseSegment(currentTime.value.getMilliseconds()) }
			</mm-text>
			<mm-text type="display-small">ms</mm-text>
		</div>
		`;
	};

	const actionTemplate = () => {
		return html`
		<mm-button
			type="icon"
			size="large"
			@click=${ handleToggleTime }
		>
			<mm-icon
				style=${ styleMap({
					fontSize:  '40px',
					color:     'black',
					translate: cancelTimer ? '' : '2px',
				}) }
				url=${ cancelTimer
					? 'https://icons.getbootstrap.com/assets/icons/pause-fill.svg'
					: 'https://icons.getbootstrap.com/assets/icons/play-fill.svg' }
			></mm-icon>
		</mm-button>

		<mm-button
			type="icon"
			size="large"
			?disabled=${ !cancelTimer }
			@click=${ handleLap }
		>
			<mm-icon
				style="font-size:24px;color:black;"
				url="https://icons.getbootstrap.com/assets/icons/flag-fill.svg"
			></mm-icon>
		</mm-button>

		<mm-button
			type="icon"
			size="large"
			@click=${ handleReset }
		>
			<mm-icon
				style="font-size:30px;color:black;"
				url="https://icons.getbootstrap.com/assets/icons/arrow-counterclockwise.svg"
			></mm-icon>
		</mm-button>
		`;
	};

	const lapsTemplate = () => {
		return html`
		<div
			style=${ styleMap({
				height: tableHeight.value ? tableHeight.value + 'px' : '',
			}) }
			class="table"
		>
			<div class="thead">
				<div class="th">Laps</div>
				<div class="th">Time</div>
				<div class="th">Total</div>
			</div>

			<div class="tbody">
				${ map(laps.value, (lap, idx) => html`
				<div id=${ lap.id } class="tr">
					<div class="td">
						${ idx }
						${ lap.fastest ? 'Fastest' : lap.slowest ? 'Slowest' : '' }
					</div>
					<div class="td">${ parseTime(lap.time) }</div>
					<div class="td">${ parseTime(lap.total) }</div>
				</div>
				`) }
			</div>
		</div>
		`;
	};

	useConnected(() => {
		resizeObs.observe(document.documentElement);
	});

	useDisconnected(() => {
		resizeObs.disconnect();
	});

	return ({
		render: () => html`
		<div class="display">
			<div class="header">
				<mm-button type="icon" size="small" variant="text">
					<mm-icon
						style="font-size: 18px;"
						url="https://icons.getbootstrap.com/assets/icons/arrows-fullscreen.svg"
					></mm-icon>
				</mm-button>
			</div>
			<div class="time">
				${ timeTemplate() }
			</div>

			<div class="actions">
				${ actionTemplate() }
			</div>
		</div>

		<div class="laps">
			${ laps.value.length ?  lapsTemplate() : nothing }
		</div>
		`,
		styles: [
			sharedStyles,
			css`
			:host {
				display: grid;
				grid-template-rows: 1fr 1fr;
				gap: 24px;
				overflow: hidden;
			}
			.display {
				display: flex;
				flex-flow: column nowrap;
				place-items: center;
				place-content: center;
				place-self: end center;
			}
			.header {
				place-self: end;
			}
			.time {
				display: flex;
			}
			.block {
				display: grid;
				grid-template-rows: 1fr auto;
				width: 180px;
			}
			.block:last-child {
				width: 120px;
			}
			mm-text {
				place-self: start center;
			}
			mm-text[type="display-large"] {
				font-size:      10rem;
				line-height:    1em;
			}
			mm-text[type="display-medium"] {
				font-size:      7rem;
				line-height:    1.1em;
				place-self: end center;
			}
			.actions {
				display: grid;
				grid-auto-flow: column;
				grid-auto-columns: max-content;
				place-items: center;
				gap: 24px;
				margin-top: 24px;
			}
			.laps {
				display: grid;
				place-items: start center;
				overflow: hidden;
			}
			.laps .table {
				width: 50vw;
			}
			`,
			css`/* Table */
			.table {
				display: grid;
				grid-template: "thead" auto
									"tbody" 1fr
									/ 1fr;
			}
			.thead {
				grid-area: thead;
				position: relative;
				display: grid;
				grid-auto-flow: column;
				grid-auto-columns: 1fr;

				font-family:    var(--title-large-font-family-name);
				font-weight:    var(--title-large-font-weight);
				font-size:      var(--title-large-font-size);
				line-height:    var(--title-large-line-height);
				letter-spacing: var(--title-large-letter-spacing);
			}
			.thead::after {
				position: absolute;
				content: '';
				bottom: 0px;
				left: -1px;
				right: -1px;
				height: 2px;
				border-radius: 2px;
				background-color: rgb(200 200 200 / 25%);
			}
			.th {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			.tbody {
				grid-area: tbody;
				display: block;
				overflow: auto;

				font-family:    var(--body-large-font-family-name);
				font-weight:    var(--body-large-font-weight);
				font-size:      var(--body-large-font-size);
				line-height:    var(--body-large-line-height);
				letter-spacing: var(--body-large-letter-spacing);
			}
			.tr {
				display: grid;
				grid-auto-flow: column;
				grid-auto-columns: 1fr;
			}
			.td {
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
			`,
		],
	});
});
