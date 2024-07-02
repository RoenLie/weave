import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */

export const calenderColumnsStyle = [
	componentStyles,
	css`
	:host {
		position: relative;
		display: block;
		overflow: hidden;

		--cell-height: 50px;
		--border: 2px solid var(--border-color);
		--border-color: rgba(var(--border-pure-color) / var(--border-opacity));
		--border-pure-color: 138 147 138;
		--border-opacity: 0.4;
		--header-bg: var(--mitm-surface);
		--base-bg: var(--mitm-surface);
		--scrollbar-bg: var(--surface-variant);
		--index-header: 2;
		--index-event: 1;
	}
	.base {
		position: relative;
		height: 100%;
		display: flex;
		flex-flow: column nowrap;
		overflow-y: auto;
		overflow-x: hidden;
		background-color: var(--base-bg);
		--scrollbar-thumb-bg: var(--scrollbar-bg);
	}
	.loader {
		pointer-events: none;
		position: absolute;
		display: grid;
		inset: 0;
		place-items: center;
	}
	.actions {
		position: absolute;
		display: flex;
		flex-flow: row nowrap;
	}
	.header-row,
	.body-row {
		padding-right: 12px;
	}
	.header-row {
		padding-top: 12px;
		z-index: var(--index-header);
		display: flex;
		flex-flow: row nowrap;
		position: sticky;
		top: 0;
		left: 0;
		background-color: var(--header-bg);
	}
	.header-column {
		flex: 1;
		border-bottom: var(--border);
		display: grid;
		grid-template-areas: "name" "date";
	}
	.header-column,
	.body-column {
		min-width: 100px;
	}
	.header-time-column,
	.body-time-column {
		width: 60px;
		min-width: 60px;
		opacity: 0.7;
	}
	.header-row .spacer-column {
		border-bottom: var(--border);
	}
	.header-time-column {
		place-self: end center;
		display: grid;
		place-items: end center;
		font-size: 0.8em;
		line-height: 1em;
	}
	.header-column-day,
	.header-column-date {
		display: grid;
		justify-items: center;
	}
	.header-column-date {
		grid-area: date;
		padding-bottom: 8px;
	}
	.header-column-spacer {
		grid-area: date;
		border-left: var(--border);
		border-image-slice: 1;
		border-image-source: linear-gradient(to bottom, transparent, var(--border-color));
	}
	.header-column-day {
		font-size: 1.25em;
		font-weight: 600;
		padding-bottom: 4px;
		grid-area: name;
	}
	.header-column-date es-button::part(button-base) {
		font-size: 1.5em;
		width: 36px;
		height: 36px;
		border-radius: 999px;
		padding: 0;
	}
	.body-row {
		display:flex;
		flex-flow: row nowrap;
	}
	.spacer-column,
	.body-column {
		position: relative;
		flex: 1;

		display: grid;
		grid-template-rows: repeat(24, 1fr);
	}
	.spacer-column > div,
	.body-column-cell {
		height: var(--cell-height);
		border-bottom: var(--border);
		overflow: hidden;
		display: grid;
	}
	.header-row .spacer-column,
	.spacer-column > div {
		border-image-slice: 1;
		border-image-source: linear-gradient(to right, transparent, var(--border-color));
	}
	.spacer-column > div:last-child,
	.body-column-cell:last-child {
		border-bottom: none;
		border-image-slice: 1;
		border-image-source: linear-gradient(to top, transparent, var(--border-color));
	}
	.body-column-cell  {
		border-left: var(--border);
	}

	.body-column-cell .body-column-cell-content {
		place-self: start;
	}
	.body-time-column .body-column-cell {
		border: none;
		overflow: unset;
	}
	.body-time-column .body-column-cell:first-child {
		visibility: hidden;
	}
	.body-time-column .body-column-cell-content {
		place-self: start center;
		transform: translateY(-50%);
		font-size: 0.8em;
		line-height: 1em;
	}
	.spacer-column {
		width: 30px;
		flex: unset;
	}
	.event {
		display: grid;
		padding: 4px;
		border-radius: 12px;
	}
	.event__inner {
		overflow: hidden;
		display: grid;
		cursor: pointer;
		border-radius: 8px;
		box-shadow: var(--box-shadow-xs);
		border: 1px solid rgb(var(--border-pure-color));
		background-color: var(--surface1);
		color: var(--on-surface);
		padding: 4px;
	}
	.event__inner:hover::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
		z-index: var(--index-event);
		pointer-events: none;
		background-color: var(--surface-press);
	}
	.event__text {
		display: grid;
		overflow: hidden;
	}
	`,
];
