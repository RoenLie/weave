import type { EventOf } from '@roenlie/core/dom';
import { css, html, nothing, type ReactiveController } from 'lit';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';

import { DynamicStyle } from '../../utilities/dynamic-styles.js';
import type { FragmentTable } from './fragment-table.js';


export class HeaderRenderController implements ReactiveController {

	protected columnIdBeingResized?: string;
	protected get firstRowFirstCell() {
		return this.host?.rowRenderer.firstRowFirstCell.value;
	}

	constructor(protected host: FragmentTable) {
		host.addController(this);
	}

	public hostConnected() {}

	public hostAfterConnected() {
		this.host.requestUpdate();
	}

	protected getHeaderCell(index: number) {
		return this.host.shadowRoot!.getElementById(String(index));
	}

	protected initResize = (ev: EventOf<HTMLElement>) => {
		ev.preventDefault();

		const columnId = ev.target.parentElement?.id;
		this.columnIdBeingResized = columnId;
		if (!columnId)
			return;

		window.addEventListener('mousemove', this.onMouseMove);
		window.addEventListener('mouseup', this.onMouseUp);

		const columnEl = this.host.shadowRoot!.getElementById(columnId);
		columnEl?.classList.add('header--being-resized');
	};

	protected onMouseMove = (() => {
		let event: MouseEvent;
		const func = () => {
			if (this.columnIdBeingResized === undefined)
				return;

			const columnEl = this.getHeaderCell(parseInt(this.columnIdBeingResized));
			if (!columnEl)
				return;

			// Calculate the desired width
			const columnRect = columnEl.getBoundingClientRect();
			const horizontalScrollOffset = this.host.scrollLeft;
			const width = (horizontalScrollOffset + event.clientX) - columnRect.x;

			const columnIndex = parseInt(this.columnIdBeingResized);

			// Find the column and set the size
			const column = this.host.columns[columnIndex];
			if (column)
				column.width = Math.max(column.minWidth ?? 150, width); // Enforce the minimum

			if (!this.host.dynamic) {
				// For the other headers which don't have a set width, fix it to their computed width
				for (let i = 0; i < this.host.columns.length; i++) {
					const column = this.host.columns[i]!;
					if (!column.width) {
						const columnEl = this.getHeaderCell(i)!;
						column.width = columnEl.clientWidth;
					}
				}
			}

			this.host.requestUpdate();
		};

		return (ev: MouseEvent) => {
			event = ev;
			requestAnimationFrame(func);
		};
	})();

	protected onMouseUp = () => {
		window.removeEventListener('mousemove', this.onMouseMove);
		window.removeEventListener('mouseup', this.onMouseUp);

		if (this.columnIdBeingResized) {
			const columnEl = this.getHeaderCell(parseInt(this.columnIdBeingResized));
			columnEl?.classList.remove('header--being-resized');
			this.columnIdBeingResized = undefined;
		}
	};

	#dynamicStyle = new DynamicStyle();
	protected get dynamicStyling() {
		this.#dynamicStyle.clear();

		this.#dynamicStyle.selector('table')
			.property('--_template-columns', 'max-content ' + this.host.columns.map(
				({ width, minWidth, defaultWidth }) => width ? width + 'px'
					: `minmax(${ minWidth ?? 150 }px, ${ defaultWidth ?? 150 }px)`,
			).join(' ') + ' 25px')
			.property('--_header-first-column-width', this.firstRowFirstCell?.offsetWidth + 'px');

		return this.#dynamicStyle.toString();
	}

	public DynamicStyles() {
		return html`
		<style>${ this.dynamicStyling }</style>
		`;
	}

	protected checkAllRows = (ev: EventOf<HTMLInputElement>) => {
		this.host.checkedRowIndexes.clear();
		this.host.allChecked = ev.target.checked;
	};

	public Header() {
		return html`
		<tr part="thead-tr">
			<th>
				${ when(this.host.options?.checkbox, () => html`
				<input
					type="checkbox"
					.checked=${ !!this.host.allChecked }
					.indeterminate=${ !!this.host.checkedRowIndexes.size }
					@change=${ this.checkAllRows }
				/>
				`) }
			</th>
			${ map(this.host.columns, (column, i) => html`
			<th id=${ i } part="th">
				${ column.headerRender?.(this.host.data) ?? column.label ?? nothing }
				<span @mousedown=${ this.initResize } class="resize-handle"></span>
			</th>
			`) }
			<th></th>
		</tr>
		`;
	}

	public static styles = css`
		thead tr {
			position: sticky;
			top: 0;
			z-index: 1;
			color: var(--_header-color);
			background-color: var(--_header-background);
			border-bottom: var(--_header-bottom-border);
		}
		thead th {
			position: relative;
			text-align: left;
			font-weight: normal;
			font-size: 1.1rem;
		}
		thead th input[type="checkbox"] {
			font-size: 0.9rem;
		}
		thead th:first-child {
			width: var(--_header-first-column-width);
		}
		thead th:last-child {
			border-right: 0;
		}
	`;

}
