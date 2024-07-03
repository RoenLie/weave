import { type PauseableEvent, pauseableEvent } from '@roenlie/core/async';
import { emitEvent, findActiveElement } from '@roenlie/core/dom';
import { noop } from '@roenlie/core/function';
import { type Fn } from '@roenlie/core/types';
import { EventController } from '@roenlie/lit-utilities/controllers';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, type TemplateResult } from 'lit';
import { eventOptions, property, query, state } from 'lit/decorators.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { MMSpinner } from '../spinner/spinner-element.js';
import { MMField } from './field-element.js';
import { MMHeader } from './header-element.js';
import { MMRow } from './row-element.js';

MMRow.register();
MMField.register();
MMHeader.register();
MMSpinner.register();


export type HeaderTemplate = (template: TemplateResult<any> | unknown) => TemplateResult<any>;
export type HeaderFieldTemplate = () => TemplateResult<any>;
export type RowTemplate<T> = (rowData: T, template: TemplateResult<any> | unknown) => TemplateResult<any>;
export type RowFieldTemplate<T> = (rowData: T) => TemplateResult<any>;
export interface ListTemplateConfig<T = any> {
	header: HeaderTemplate;
	headerField: HeaderFieldTemplate[];
	row: RowTemplate<T>;
	rowField: RowFieldTemplate<T>[];
}


@customElement('mm-template-list')
export class MMTemplateList<T extends object = object> extends MimicElement {

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
	@query('.header')        protected headerQry: HTMLElement;
	@query('#tombstone-top') protected tombstoneTopQry: HTMLElement;
	@query('#tombstone-bot') protected tombstoneBotQry: HTMLElement;
	public previousFocus?: HTMLElement;
	protected _items: T[] = [];
	protected headerHeight: number;
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

		this.updateComplete.then(() => {
			this.headerHeight = this.headerQry.offsetHeight;
		});
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
			const next = activeElement?.nextElementSibling as HTMLElement | undefined;
			const prev = activeElement?.previousElementSibling as HTMLElement | undefined;

			if (ev.code === 'ArrowUp') {
				ev.preventDefault();

				if (prev instanceof MMRow) {
					prev.focus();
					this.previousFocus = prev;
					this.selectItem(prev);
				}
			}
			if (ev.code === 'ArrowDown') {
				ev.preventDefault();
				if (next instanceof MMRow) {
					next.focus();
					this.previousFocus = prev;
					this.selectItem(next);
				}
			}
			if ([ 'Enter', 'NumpadEnter', 'Space' ].includes(ev.code)) {
				ev.preventDefault();
				if (activeElement instanceof MMRow)
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
					: this.renderRoot.querySelector('mm-row')
				);

				if (!row?.matches(':focus-visible') && !this.matches(':focus-visible'))
					return;

				if (row instanceof MMRow) {
					row.focus();
					this.selectItem(row);
				}
			},
		);

		this.eventController.addEventListener(
			this, 'focusout',
			async () => {
				const rows = [ ...this.renderRoot.querySelectorAll('mm-row') ];
				rows.forEach(row => row.tabIndex = -1);
				this.previousFocus && (this.previousFocus.tabIndex = 0);
			},
		);
	}

	protected async setupIntersectionObs() {
		if (!this.hasUpdated)
			await this.updateComplete;

		this.intersectObs = new IntersectionObserver(
			intersectionScrollObserver(
				this.tombstoneTopQry,
				this.tombstoneBotQry,
				() => {},
				() => this.appendItems(),
			), {
				root:       this.baseQry,
				rootMargin: '10px',
			},
		);

		this.intersectObs.observe(this.tombstoneTopQry);
		this.intersectObs.observe(this.tombstoneBotQry);
	}

	protected async appendItems() {
		if (this.loading)
			return;

		this.loading = true;

		await pauseableEvent(this, 'mm-append-items');

		this.loading = false;

		this.loadChunk();
	}

	protected selectItem(row: MMRow | undefined) {
		if (!row)
			return;

		const index = [ ...this.renderRoot.querySelectorAll('mm-row') ].indexOf(row);
		this.previousFocus = row;
		emitEvent(this, 'mm-select-row', { detail: { index, row } });
	}

	protected activateItem(row: MMRow | undefined) {
		if (!row)
			return;

		const index = [ ...this.renderRoot.querySelectorAll('mm-row') ].indexOf(row);
		emitEvent(this, 'mm-activate-row', { detail: { index, row } });
	}

	protected handlePointerdown = (ev: PointerEvent) => {
		if (ev.detail === 1)
			this.singleClick(ev);
		if (ev.detail === 2)
			this.dblClick(ev);
		if (ev.detail >= 2)
			return ev.preventDefault();
	};

	@eventOptions({ passive: true })
	protected handleScroll() {
		const style = this.tombstoneTopQry.style;
		const padding = Math.min(this.baseQry.scrollTop, this.headerHeight) + 'px';
		const currentStyle = style.getPropertyValue('padding-bottom');
		if (currentStyle !== padding)
			style.setProperty('padding-bottom', padding);
	}

	protected singleClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const row = path.find((el): el is MMRow => el instanceof MMRow);
		this.selectItem(row);
	}

	protected dblClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const row = path.find((el): el is MMRow => el instanceof MMRow);
		this.activateItem(row);
	}
	//#endregion


	//#region Template
	public override render(): unknown {
		return html`
		<section
			class="base"
			@mousedown=${ this.handlePointerdown }
			@scroll=${ this.handleScroll }
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
				<mm-spinner style=${ styleMap({
					visibility: this.loading ? 'visible' : 'hidden',
				}) }></mm-spinner>
			</div>
		</section>
		`;
	}

	public static override styles = [
		sharedStyles,
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
			gap: var(--mm-spacing-xs);
		}
		.header {
			top: 0;
			position: sticky;
			background-color: var(--mm-background);
		}
		.spinner {
			padding-block: var(--mm-spacing-s);
			padding-inline: var(--mm-spacing-xl);
		}
	`,
	];
	//#endregion

}


declare global {
	interface HTMLElementTagNameMap {
		'mm-template-list': MMTemplateList;
	}
	interface HTMLElementEventMap {
		/** Fired before items are retrieved from the items cache. */
		'mm-append-items': PauseableEvent;
		/** Fired when a row is clicked or selected through keyboard navigation. */
		'mm-select-row': CustomEvent<{index: number; row: MMRow}>;
		/** Fired when a row is double clicked or enter key is used when it focused. */
		'mm-activate-row': CustomEvent<{index: number; row: MMRow}>;
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
				const currentRatio  = entry.intersectionRatio;
				const previousRatio = topRatio;
				if (isNaN(previousRatio))
					return (topRatio = currentRatio);

				if (isScrollingUp(entry, previousRatio, currentRatio))
					topCallback();

				topRatio = currentRatio;
			}

			if (target === botElement) {
				const currentRatio  = entry.intersectionRatio;
				const previousRatio = botRatio;
				if (isNaN(previousRatio))
					return botRatio = currentRatio;

				if (isScrollingDown(entry, previousRatio, currentRatio))
					botCallback();

				botRatio = currentRatio;
			}
		});
	};
};
