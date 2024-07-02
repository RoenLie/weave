import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */

export const infiniteCalenderStyle = [
	componentStyles,
	css`
	:host {
		display: contents;
	}
	.base {
		display: grid;
		grid-template-rows: auto auto 1fr;
		gap: 4px;
		overflow: hidden;
		font-size: 12px;
	}
	.date-list-wrapper {
		display: grid;
		grid-auto-flow: row dense;
		grid-auto-rows: min-content;
		overflow: hidden;
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px;
	}
	.year-display {
		font-size: 1.3em;
	}
	.actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.weekdays {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
	}
	.weeknum {
		font-weight: 600;
		opacity: 0.8;
		text-align: center;
		vertical-align: middle;
		border-right: 1px solid grey;
		margin-right: 4px;
		padding-right: 4px;
	}
	.weekday {
		opacity: 0.8;
		font-weight: 600;
		text-align: center;
		vertical-align: middle;
	}
	.date-list {
		display: grid;
	}
	.year {
		font-weight: 600;
		display: grid;
		place-items: center;
	}
	.month {
		font-weight: 600;
		display: grid;
		place-items: center;
	}
	.week {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
	}
	.date {
		position: relative;
		text-align: center;
		vertical-align: middle;
		cursor: pointer;
	}
	.date::after {
		pointer-events: none;
		content: '';
		position: absolute;
		inset: 0;
		background-color: transparent;
	}
	.date:hover {
		background-color: var(--on-surface-hover);
	}
	.date.today {
		background-color: var(--primary);
		color: var(--on-primary);
		border-radius: 8px;
	}
	.date.today:hover {
		background-color: var(--primary-hover);
		color: var(--primary);
	}
	.date.downrank {
		opacity: 0.5;
	}
	.date.selected-first,
	.date.selected-middle,
	.date.selected-last,
	.date.selected-single {
		opacity: 1;
		border-radius: 0px;
		background-color: var(--error-container);
		color: var(--on-error-container);
	}
	.date.selected-first,
	.date.selected-single {
		border-top-left-radius: 8px;
		border-bottom-left-radius: 8px;
	}
	.date.selected-last,
	.date.selected-single {
		border-top-right-radius: 8px;
		border-bottom-right-radius: 8px;
	}
	.date.selected-first:hover::after ,
	.date.selected-middle:hover::after ,
	.date.selected-last:hover::after  {
		color: var(--on-error-container-hover);
		background-color: var(--error-container-hover);
	}
	`,
];
