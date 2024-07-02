import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */

export const appStyle = [
	componentStyles,
	css`
	:host {
		display: grid;
	}
	.base {
		display: grid;
		grid-template-columns: auto 1fr auto;
	}
	.base :first-child {
		border-right: 2px solid rgb(60,60,60);
	}
	.base :not(:first-child, :last-child) {
		place-items: center;
	}
	.base :last-child {
		border-left: 2px solid rgb(60,60,60);
	}
	`,
];
