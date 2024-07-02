import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */
export const calenderNavigationStyle = [
	componentStyles,
	css`
	:host {
		height: 100%;
		padding: 12px;
		display: grid;
	}
	.base {
		display: grid;
		grid-template-rows: 1fr auto auto;
		gap: 8px;
		overflow: hidden;
	}
	es-button-group {
		width: 100%;
	}
	es-button {
		width: 100%;
	}
	es-radio-group[vertical]::part(input) {
		justify-content: space-around;
	}
	.menu {
		display: grid;
		gap: 4px;
	}
	`,
];
