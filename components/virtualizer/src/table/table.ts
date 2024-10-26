import type { PathOf } from '@roenlie/core/types';
import { queryId } from '@roenlie/lit-utilities/decorators';
import { customElement, MimicElement } from '@roenlie/lit-utilities/element';
import { css, CSSResult, html, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';

import { MMVirtualScrollbar } from './virtual-scrollbar/virtual-scrollbar.cmp.js';
import { HeaderRenderController } from './header-render-controller.js';
import { RowRenderController } from './row-render-controller.js';

MMVirtualScrollbar.register();


export interface Options {
	checkbox?: boolean;
}


export interface Column<T extends Record<string, any>> {
	width?:        number;
	minWidth?:     number;
	defaultWidth?: number;
	resizeable?:   boolean;
	label?:        string;
	field?:        PathOf<T>;
	headerRender?: (data: T[]) => TemplateResult<any>;
	fieldRender?:  (data: T) => TemplateResult<any>;
	fieldEditor?:  (data: T) => TemplateResult<any>;
}


/**
 * @emits header-click
 * @emits header-dbl-click
 * @emits row-click
 * @emits row-dbl-click
 * @emits row-check
 * @emits row-check-all
 * @emits cell-click
 * @emits cell-dbl-click
 */
@customElement('mm-fragment-table')
export class FragmentTable extends MimicElement {

	@property({ type: Array }) public columns:                      Column<any>[] = [];
	@property({ type: Array }) public data:                         Record<string, any>[] = [];
	@property({ type: Object }) public options?:                    Options;
	@property({ type: String }) public styles?:                     string | CSSResult;
	@property({ type: Boolean }) public dynamic?:                   boolean;
	@property({ type: Boolean, reflect: true }) public contain?:    boolean;
	@property({ type: Boolean, reflect: true }) public allChecked?: boolean;

	@queryId('table') protected table?:          HTMLTableElement;
	@queryId('top-buffer') protected topBuffer?: HTMLElement;

	protected tablePromise = this.updateComplete.then(() => this.table);
	protected topBufferPromise = this.updateComplete.then(() => this.topBuffer);
	protected focusRow:    number | undefined = undefined;
	protected focusedCell: number | undefined = undefined;
	protected eventOptions = { bubbles: true, cancelable: true, composed: true };
	public readonly headerRenderer = new HeaderRenderController(this);
	public readonly rowRenderer = new RowRenderController(this);
	public readonly checkedRowIndexes = new Set<number>();

	public toggleEditor(): void;
	public toggleEditor(row: number | string, column: number | string): void;
	public toggleEditor(row?: number | string, column?: number | string) {
		if (row !== undefined && column !== undefined) {
			this.rowRenderer.editorCell = {
				rowIndex:    Number(row),
				columnIndex: Number(column),
			};
		}
		else {
			this.rowRenderer.editorCell = undefined;
		}

		this.requestUpdate();
	}

	public override connectedCallback() {
		super.connectedCallback();

		this.classList.toggle('initializing', true);
	}

	public override afterConnectedCallback() {
		setTimeout(() => {
			this.headerRenderer.hostAfterConnected();
			this.rowRenderer.hostAfterConnected();

			this.updateComplete.then(() => {
				this.renderRoot
					.querySelectorAll<MMVirtualScrollbar>('mm-virtual-scrollbar')
					.forEach(el => el.updateHeight());

				this.classList.toggle('initializing', false);
			});
		});
	}

	protected handleHeadChange(ev: Event) {
		const path = ev.composedPath();
		const checkbox = path.find(el => el instanceof HTMLInputElement && el.type === 'checkbox');

		if (checkbox) {
			const ev = new CustomEvent('row-check-all', { ...this.eventOptions, detail: checkbox });
			checkbox.dispatchEvent(ev);
		}
	}

	protected handleHeadClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const cell = path.find((el): el is HTMLTableCellElement =>
			el instanceof HTMLTableCellElement);

		const baseOptions = { bubbles: true, cancelable: true, composed: true };
		const cellEvent = new CustomEvent('header-click', { ...baseOptions, detail: cell });

		cell?.dispatchEvent(cellEvent);
	}

	protected handleHeadDblClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const cell = path.find((el): el is HTMLTableCellElement =>
			el instanceof HTMLTableCellElement);

		const baseOptions = { bubbles: true, cancelable: true, composed: true };
		const cellEvent = new CustomEvent('header-dbl-click', { ...baseOptions, detail: cell });

		cell?.dispatchEvent(cellEvent);
	}

	protected handleHeadMousedown(ev: MouseEvent) {
		if (ev.detail === 2)
			ev.preventDefault();
	}

	protected handleBodyClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const row = path.find((el): el is HTMLTableRowElement => el instanceof HTMLTableRowElement);
		const cell = path.find((el): el is HTMLTableCellElement => el instanceof HTMLTableCellElement);

		const rowEvent = new CustomEvent('row-click', { ...this.eventOptions, detail: row });
		const cellEvent = new CustomEvent('cell-click', { ...this.eventOptions, detail: cell });

		row?.dispatchEvent(rowEvent);
		cell?.dispatchEvent(cellEvent);
	}

	protected handleBodyDblClick(ev: PointerEvent) {
		const path = ev.composedPath();
		const row = path.find((el): el is HTMLTableRowElement => el instanceof HTMLTableRowElement);
		const cell = path.find((el): el is HTMLTableCellElement => el instanceof HTMLTableCellElement);

		const rowEvent = new CustomEvent('row-dbl-click', { ...this.eventOptions, detail: row });
		const cellEvent = new CustomEvent('cell-dbl-click', { ...this.eventOptions, detail: cell });

		row?.dispatchEvent(rowEvent);
		cell?.dispatchEvent(cellEvent);
	}

	protected handleBodyMousedown(ev: MouseEvent) {
		if (ev.detail === 2)
			ev.preventDefault();
	}

	protected handleBodyChange(ev: Event) {
		const path = ev.composedPath();
		const checkbox = path.find(el => el instanceof HTMLInputElement && el.type === 'checkbox');

		if (checkbox) {
			const ev = new CustomEvent('row-check', { ...this.eventOptions, detail: checkbox });
			checkbox.dispatchEvent(ev);
		}
	}

	protected override render() {
		return html`
		<style>${ this.styles }</style>

		${ this.headerRenderer.DynamicStyles() }
		${ this.rowRenderer.dynamicStyles() }

		<table id="table" part="table">
			<thead
				@change=${ this.handleHeadChange }
				@click=${ this.handleHeadClick }
				@dblclick=${ this.handleHeadDblClick }
				@mousedown=${ this.handleHeadMousedown }
			>
				${ this.headerRenderer.Header() }
			</thead>
			<tbody
				@change=${ this.handleBodyChange }
				@click=${ this.handleBodyClick }
				@dblclick=${ this.handleBodyDblClick }
				@mousedown=${ this.handleBodyMousedown }
			>
				${ this.rowRenderer.rows() }
			</tbody>
		</table>

		<mm-virtual-scrollbar
			placement="end"
			direction="horizontal"
			.reference=${ this.tablePromise }
			.widthResizeRef=${ this.topBufferPromise }
		></mm-virtual-scrollbar>

		<mm-virtual-scrollbar
			placement="end"
			direction="vertical"
			.reference=${ this.tablePromise }
		></mm-virtual-scrollbar>
		`;
	}

	public static override styles = [
		css`
		* {
			box-sizing: border-box;
		}
		mm-virtual-scrollbar {
			--vscroll-size: 12px;
			--vscroll-background: rgb(100 100 100 / 90%);
		}
		mm-virtual-scrollbar[direction="vertical"]::part(wrapper) {
			top: 50px;
		}
		:host(.initializing) {
			visibility: hidden;
		}
		:host {
			--_header-color:         var(--header-color, #ffffff);
			--_header-background:    var(--header-background, #076ba5);
			--_header-bottom-border: var(--header-bottom-border);
			--_row-height:           var(--row-height, 50px);
			--_row-background:       var(--row-background);
			--_row-even-background:  var(--row-even-background, rgb(50 50 50));
			--_row-bottom-border:    var(--row-bottom-border, 1px solid rgb(80 80 80));
			--_row-background-hover: var(--row-background-hover, rgb(100 100 100));
			--_table-color:          var(--table-color, rgb(250 250 250));
			--_table-background:     var(--table-background, rgb(40 40 40));
			--_table-bottom-border:  var(--table-bottom-border, 2px solid #076ba5);

			position: relative;
			display: grid;
			overflow: hidden;
		}
		table {
			position: relative;
			overflow: auto;
			overscroll-behavior: contain;
			display: grid;
			grid-auto-flow: row;
			grid-auto-rows: max-content;
			border-collapse: collapse;
			min-width: 100%;

			font-size: 0.9em;
			box-shadow: 0 0 4px rgba(0, 0, 0, 0.15);
			color: var(--_table-color);
			background: var(--_table-background);
			border-bottom: var(--_table-bottom-border);
		}
		:host([contain]) table {
			/* Used for performance */
			contain: content;
		}
		thead, tbody {
			display: contents;
		}
		th, td {
			display: flex;
			place-items: center start;
			padding-inline: 6px;
		}
		th span, td span {
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
		}
		`,
		HeaderRenderController.styles,
		RowRenderController.styles,
		css` /* Resize handle */
		.resize-handle {
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			background: black;
			opacity: 0;
			width: 3px;
			cursor: col-resize;
		}
		.resize-handle:hover,
		.header--being-resized .resize-handle {
			opacity: 0.5;
		}
		th:hover .resize-handle {
			opacity: 0.3;
		}
		`,
		css` /* Input checkbox styling */
		input[type="checkbox"] {
			/* Add if not using autoprefixer */
			-webkit-appearance: none;
			/* Remove most all native input styles */
			appearance: none;
			/* For iOS < 15 */
			background-color: transparent;
			/* Not removed via appearance */
			margin: 0;

			font: inherit;
			color: currentColor;
			width: 1.15em;
			height: 1.15em;
			border: 0.15em solid currentColor;
			border-radius: 0.15em;
			transform: translateY(-0.075em);

			display: grid;
			place-content: center;
		}
		input[type="checkbox"]::before {
			content: "";
			width: 0.65em;
			height: 0.65em;
			clip-path: polygon(0 30%, 100% 30%, 100% 70%, 0 70%);
			transform: scale(0);
			transform-origin: center;
			transition: 120ms transform ease-out;
			box-shadow: inset 1em 1em currentColor;
			/* Windows High Contrast Mode */
			background-color: CanvasText;
		}
		input[type="checkbox"]:checked::before {
			clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
			transform: scale(1);
		}
		input[type="checkbox"]:focus-visible {
			outline: max(2px, 0.15em) solid currentColor;
			outline-offset: max(2px, 0.15em);
		}
		input[type="checkbox"]:indeterminate::before {
			clip-path: polygon(0 40%, 100% 40%, 100% 60%, 0 60%);
			transform: scale(1);
		}
		input[type="checkbox"]:disabled {
			opacity: 50%;
			cursor: not-allowed;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'fragment-table': FragmentTable;
	}
}
