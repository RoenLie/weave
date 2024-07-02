import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */

export const loadingIndicatorStyle = [
	componentStyles,
	css`
	:host {
		display: contents;
		--box-shadow: var(--box-shadow-s);
		--loader-border: 1px solid var(--surface-variant);
		--loader-bg: var(--surface2);
		--loader-color: var(--on-surface2);
	}
	.loader {
		z-index: var(--index-drawer);
		position: absolute;
		display: grid;
		inset: 0;
		place-items: center;
	}
	.loader-container {
		height: 100px;
		width: 100px;
		border-radius: 12px;
		box-shadow: var(--box-shadow);
		border: var(--loader-border);
		background-color: var(--loader-bg);
		color: var(--loader-color);
		display: grid;
		grid-template-rows: auto 1fr;
		place-items: center;
		padding-top: 8px;
	}
	.loader-container span {
		font-weight: bold;
		font-size: 12px;
		opacity: 0.7;
	}
	`,
];
