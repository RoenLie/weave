import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */

export const upsertEntryStyle = [
	componentStyles,
	css`
	:host {
		position: relative;
		display: block;
	}
	es-drawer {
		--body-spacing: 16px;
	}
	es-drawer::part(panel) {
		width: 50vw;
		padding: 12px;
		border-left: 2px solid var(--surface-variant);
		background-color: var(--surface3);
	}
	es-drawer::part(body) {
		/*background-color: var(--surface4);*/
		box-shadow: inset var(--box-shadow-xs), inset var(--box-shadow-s), inset var(--box-shadow-m);
		border-radius: 12px;
	}
	es-drawer::part(footer) {
		display: flex;
    	justify-content: end;
		gap: 12px;
	}
	`,
];
