import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css } from 'lit';


/** @internalexport */
export const drawerStyle = [
	sharedStyles,
	css`
	:host {
		--header-spacing: var(--spacing-m);
		--body-spacing: var(--spacing-m);
		--footer-spacing: var(--spacing-m);
		--panel-size: 65vw;
		--panel-background-color: var(--surface);
		--panel-transition-speed: var(--transition-medium);
		--overlay-background-color: var(--transparent-1);
		--panel-block-padding: var(--spacing-xs);
		display: contents;
	}
	.drawer {
		top: 0;
		inset-inline-start: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		overflow: hidden;
	}
	.drawer--contained {
		position: absolute;
		z-index: initial;
	}
	.drawer--fixed {
		position: fixed;
		z-index: var(--index-drawer);
	}
	.drawer__panel {
		position: absolute;
		display: grid;
		grid-template: "header" auto "body" 1fr "footer" auto / 1fr;
		z-index: 2;
		max-width: 100%;
		max-height: 100%;
		background-color: var(--panel-background-color);
		transition: var(--panel-transition-speed) transform;
		overflow: auto;
		pointer-events: all;
		padding-block: var(--panel-block-padding);
		box-shadow: var(--box-shadow-xs);
	}
	.drawer__panel:focus {
		outline: none;
	}
	.drawer--top .drawer__panel {
		top: 0;
		inset-inline-end: auto;
		bottom: auto;
		inset-inline-start: 0;
		width: 100%;
		height: var(--panel-size);
		border-block-end: 1px solid var(--outline-variant);
	}
	.drawer--bottom .drawer__panel {
		top: auto;
		inset-inline-end: auto;
		bottom: 0;
		inset-inline-start: 0;
		width: 100%;
		height: var(--panel-size);
		border-block-start: 1px solid var(--outline-variant);
	}
	.drawer--start .drawer__panel {
		top: 0;
		inset-inline-end: auto;
		bottom: auto;
		inset-inline-start: 0;
		width: var(--panel-size);
		height: 100%;
		border-inline-end: 1px solid var(--outline-variant);
	}
	.drawer--end .drawer__panel {
		top: 0;
		inset-inline-end: 0;
		bottom: auto;
		inset-inline-start: auto;
		width: var(--panel-size);
		height: 100%;
		border-inline-start: 1px solid var(--outline-variant);
	}
	.drawer__header {
		grid-area: header;
		display: grid;
		grid-template-columns: 1fr auto;
	}
	.drawer__title {
		padding: var(--header-spacing);
		margin: 0;
	}
	.drawer__close {
		display: flex;
		place-items: center;
		padding: 0 var(--header-spacing);
	}
	.drawer__body {
		grid-area: body;
		display: grid;
		padding: var(--body-spacing);
		overflow: auto;
		-webkit-overflow-scrolling: touch;
	}
	.drawer__footer {
		grid-area: footer;
		text-align: right;
		padding: var(--footer-spacing);
	}
	.drawer__footer ::slotted(mm-button:not(:last-of-type)) {
		margin-inline-end: var(--spacing-x-small);
	}
	.drawer:not(.drawer--has-footer) .drawer__footer {
		display: none;
	}
	.drawer__overlay {
		display: block;
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		left: 0;
		background-color: var(--overlay-background-color);
		pointer-events: all;
	}
	.drawer--contained .drawer__overlay {
		position: absolute;
	}
	`,
];
