import { PauseableEvent, pauseableEvent } from '@roenlie/core/async';
import { emitEvent, findActiveElement } from '@roenlie/core/dom';
import { noop } from '@roenlie/core/function';
import { Fn } from '@roenlie/core/types';
import { EventController } from '@roenlie/lit-utilities/controllers';
import { css, html, LitElement, TemplateResult } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { componentStyles } from '../../features/shared-styles/component-styles.js';
import { RowCmp } from './row.cmp.js';


export type HeaderTemplate = (template: TemplateResult<any> | unknown) => TemplateResult<any>;
export type HeaderFieldTemplate = () => TemplateResult<any>;
export type RowTemplate = (rowData: any, template: TemplateResult<any> | unknown) => TemplateResult<any>;
export type RowFieldTemplate = (rowData: any) => TemplateResult<any>;
export type ListTemplateConfig = {
	header: HeaderTemplate;
	headerField: HeaderFieldTemplate[];
	row: RowTemplate;
	rowField: RowFieldTemplate[];
}


@customElement('pl-template-list')
export class ListCmp<T extends object = object> extends LitElement {

	//#region Properties
	@property({ type: Number }) public chunks = 15;
	@property({ type: Array,  attribute: false }) public items: T[] = [];
	@property({ type: Object, attribute: false }) public templates: ListTemplateConfig = {
		header:      noop(html``),
		headerField: [],
		row:         noop(html``),
		rowField:    [],
	};

	@state() protected loading = false;
	@query('.base')          protected baseQry: HTMLElement;
	@query('#tombstone-top') protected tombstoneTopQry: HTMLElement;
	@query('#tombstone-bot') protected tombstoneBotQry: HTMLElement;
	public previousFocus?: HTMLElement;
	protected _items: T[] = [];
	protected intersectObs: IntersectionObserver;
	protected readonly eventController = new EventController({ host: this });
	//#endregion


	//#region Lifecycle
	public override connectedCallback() {
		super.connectedCallback();

		this.tabIndex = 0;
		this._items = this.items.slice(0, this.chunks);

		this.setupFocusEvents();
		this.setupKeyboardEvents();
		this.setupIntersectionObs();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
		this.intersectObs.disconnect();
	}
	//#endregion


	//#region Logic
	public loadChunk() {
		const newItems = this.items.slice(
			this._items.length,
			this._items.length + this.chunks,
		);

		this._items.push(...newItems);

		this.requestUpdate();
	}

	public reset() {
		this._items.length = 0;
		this.loadChunk();
	}

	protected setupKeyboardEvents() {
		this.eventController.addEventListener(this, 'keydown', (ev) => {
			const activeElement = findActiveElement(this) as HTMLElement;
			let next = activeElement?.nextElementSibling as HTMLElement | undefined;
			let prev = activeElement?.previousElementSibling as HTMLElement | undefined;

			if (ev.code === 'ArrowUp') {
				ev.preventDefault();

				if (prev instanceof RowCmp) {
					prev.focus();
					this.previousFocus = prev;
					this.selectItem(prev);
				}
			}
			if (ev.code === 'ArrowDown') {
				ev.preventDefault();
				if (next instanceof RowCmp) {
					next.focus();
					this.previousFocus = prev;
					this.selectItem(next);
				}
			}
			if ([ 'Enter', 'NumpadEnter', 'Space' ].includes(ev.code)) {
				ev.preventDefault();
				if (activeElement instanceof RowCmp)
					this.activateItem(activeElement);
			}
			if (ev.code === 'Tab') {
				this.setAttribute('inert', '');
				setTimeout(() => this.removeAttribute('inert'));
			}
		});
	}

	protected setupFocusEvents() {
		this.eventController.addEventListener(
			this, 'focusin',
			async () => {
				const row = (this.previousFocus
					? this.previousFocus
					: this.renderRoot.querySelector('pl-row')
				);

				if (!row?.matches(':focus-visible') && !this.matches(':focus-visible'))
					return;

				if (row instanceof RowCmp) {
					row.focus();
					this.selectItem(row);
				}
			},
		);

		this.eventController.addEventListener(
			this, 'focusout',
			async () => {
				const rows = [ ...this.renderRoot.querySelectorAll('pl-row') ];
				rows.forEach(row => row.tabIndex = -1);
				this.previousFocus!.tabIndex = 0;
			},
		);
	}

	protected async setupIntersectionObs() {
		if (!this.hasUpdated)
			await this.updateComplete;

		this.intersectObs = new IntersectionObserver(intersectionScrollObserver(
			this.tombstoneTopQry,
			this.tombstoneBotQry,
			() => {},
			() => this.appendItems(),
		), {
			root:       this.baseQry,
			rootMargin: '10px',
		});

		this.intersectObs.observe(this.tombstoneTopQry);
		this.intersectObs.observe(this.tombstoneBotQry);
	}

	protected async appendItems() {
		if (this.loading)
			return;

		this.loading = true;

		await pauseableEvent(this, 'pl-append-items');

		this.loading = false;

		this.loadChunk();
	}

	protected selectItem(row: RowCmp | undefined) {
		if (!row)
			return;

		const index = [ ...this.renderRoot.querySelectorAll('pl-row') ].indexOf(row);
		this.previousFocus = row;
		emitEvent(this, 'pl-select-row', { detail: { index, row } });
	}

	protected activateItem(row: RowCmp | undefined) {
		if (!row)
			return;

		const index = [ ...this.renderRoot.querySelectorAll('pl-row') ].indexOf(row);
		emitEvent(this, 'pl-activate-row', { detail: { index, row } });
	}

	protected handlePointerdown = (ev: PointerEvent) => {
		if (ev.detail === 1)
			this.singleClick(ev);
		if (ev.detail === 2)
			this.dblClick(ev);
		if (ev.detail >= 2)
			return ev.preventDefault();
	};

	protected singleClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const row = path.find((el): el is RowCmp => el instanceof RowCmp);
		this.selectItem(row);
	}

	protected dblClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const row = path.find((el): el is RowCmp => el instanceof RowCmp);
		this.activateItem(row);
	}
	//#endregion


	//#region Template
	public override render(): unknown {
		return html`
		<section
			class="base"
			@mousedown=${ this.handlePointerdown }
		>
			<div class="header">
				${ this.templates.header(map(this.templates.headerField, fn => fn())) }
			</div>

			<div id="tombstone-top" class="tombstone"></div>

			${ map(this._items, item => html`
			${ this.templates.row(item, map(this.templates.rowField, fn => fn(item))) }
			`) }

			<div id="tombstone-bot" class="tombstone"></div>

			<div class="spinner">
				<pl-spinner style=${ styleMap({
					visibility: this.loading ? 'visible' : 'hidden',
				}) }></pl-spinner>
			</div>
		</section>
		`;
	}

	public static override styles = [
		componentStyles,
		css`
		:host {
			overflow: hidden;
			display: grid;
			width: 100%;
			outline: none;
		}
		.base {
			overflow: auto;
			display: grid;
			grid-auto-rows: max-content;
			gap: var(--spacing-xs);
		}
		.header {
			top: 0;
			position: sticky;
			background-color: var(--background);
		}
		.spinner {
			padding-block: var(--spacing-s);
			padding-inline: var(--spacing-xl);
		}
	`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'pl-template-list': ListCmp;
	}
	interface HTMLElementEventMap {
		/** Fired before items are retrieved from the items cache. */
		'pl-append-items': PauseableEvent;
		/** Fired when a row is clicked or selected through keyboard navigation. */
		'pl-select-row': CustomEvent<{index: number; row: RowCmp}>;
		/** Fired when a row is double clicked or enter key is used when it focused. */
		'pl-activate-row': CustomEvent<{index: number; row: RowCmp}>;
	}
}


const intersectionScrollObserver = (
	topElement: Element, botElement: Element,
	topCallback: Fn, botCallback: Fn,
) => {
	let topRatio = NaN;
	let botRatio = NaN;

	const isScrollingUp = (entry: IntersectionObserverEntry, previousRatio: number, currentRatio: number) =>
		currentRatio >= previousRatio && entry.isIntersecting;
	const isScrollingDown = (entry: IntersectionObserverEntry, previousRatio: number, currentRatio: number) =>
		currentRatio >= previousRatio && entry.isIntersecting;

	return (entries: IntersectionObserverEntry[]) => {
		entries.forEach(entry => {
			const target = entry.target;
			if (target === topElement) {
				let currentRatio  = entry.intersectionRatio;
				let previousRatio = topRatio;
				if (isNaN(previousRatio))
					return (topRatio = currentRatio);

				if (isScrollingUp(entry, previousRatio, currentRatio))
					topCallback();

				topRatio = currentRatio;
			}

			if (target === botElement) {
				let currentRatio  = entry.intersectionRatio;
				let previousRatio = botRatio;
				if (isNaN(previousRatio))
					return botRatio = currentRatio;

				if (isScrollingDown(entry, previousRatio, currentRatio))
					botCallback();

				botRatio = currentRatio;
			}
		});
	};
};
