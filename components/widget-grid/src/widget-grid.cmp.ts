import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { when } from 'lit/directives/when.js';


export interface GridConfig {
	area:    Area;
	rows:    number;
	columns: number;
	element: HTMLElement;
}

/** A string representing the grid area of a element. */
type Area = `${ string }/${ string }/${ string }/${ string }`;

type Grid = HTMLElement[][][];


const inRange = (val: number, from: number, to: number) => val >= from && val <= to;


const range = (length: number): undefined[] => {
	const arr: any[] = [];
	for (let i = 0; i < length; i++)
		arr.push(undefined);

	return arr;
};


@customElement('widget-grid')
export class WidgetGridCmp extends LitElement {

	@state() protected rows = 10;
	@state() protected columns = 5;
	@state() protected showGrid = false;
	@state() protected highlightedArea?: Area;

	protected rowHeight = 100;
	protected columnWidth = 200;

	/** stuff */
	protected grids = new Map<number, Grid>();

	/** Grid structure that holds the state of the different cells. */
	protected grid: Grid = [];
	protected gridLookup = new Map<HTMLElement, Area>();
	protected resizeCtrl = new ResizeObserver((entries) => {
		const entry = entries[0]!;
		const rect = entry.contentRect;
		const width = rect.width;

		this.setColumns(width);
	});


	//#region public api
	public getConfig() {
		const slottedElements = new Set(this.shadowRoot!
			.querySelector('slot')!
			.assignedElements() as HTMLElement[]);

		const config: GridConfig[] = [];

		slottedElements.forEach(element => {
			const area = element.getAttribute('widget-area') as Area | null;
			if (!area)
				throw new Error('Slotted element missing assigned area');

			const [ rowStart, colStart, rowEnd, colEnd ] = this.areaToRanges(area);
			const rows = rowEnd - rowStart + 1;
			const columns = colEnd - colStart + 1;

			config.push({ area, rows, columns, element });
		});

		return config;
	}

	public printGrid(): void {
		const reOrdered: Grid = [];

		this.grid.forEach((rows, colI) => {
			rows.forEach((el, rowI) => {
				reOrdered[rowI] ??= [];
				reOrdered[rowI]![colI] = el;
			});
		});

		console.table(reOrdered);
	}
	//#endregion public api


	//#region logic
	protected emitGridConfig() {
		this.dispatchEvent(new CustomEvent('change',
			{ composed: true, detail: this.getConfig() }));
	}

	protected rangesToArea(
		colStart: number, colEnd: number,
		rowStart: number, rowEnd: number,
	): Area {
		return `${ rowStart }/${ colStart }/${ rowEnd }/${ colEnd }`;
	}

	protected areaToRanges(area: Area) {
		return area.split('/').map(s => Number(s)) as unknown as [
			rowStart: number,
			colStart: number,
			rowEnd: number,
			colEnd: number
		];
	}

	protected areaToGridArea(area: Area) {
		const [ rowStart, colStart, rowEnd, colEnd ] = this.areaToRanges(area);

		return this.rangesToArea(colStart + 1, colEnd + 2, rowStart + 1, rowEnd + 2);
	}

	protected iterateArea(area: Area, fn: (col: number, row: number) => void) {
		const [ rowStart, colStart, rowEnd, colEnd ] = this.areaToRanges(area);

		for (let ci = colStart; ci <= colEnd; ci++) {
			for (let ri = rowStart; ri <= rowEnd; ri++)
				fn(ci, ri);
		}
	}

	protected highlightValid(
		element: HTMLElement,
		fromCol: number, fromRow: number,
		toCol: number,   toRow: number,
	) {
		this.highlightedArea = undefined;

		const targetArea = this.rangesToArea(fromCol, toCol, fromRow, toRow);
		const { outOfBounds, hasConflict } = this.hasConflicts(this.grid, element, targetArea);

		if (!outOfBounds && !hasConflict)
			this.highlightedArea = targetArea;

		this.requestUpdate();
	};

	protected hasConflicts(grid: Grid, element: HTMLElement, area: Area) {
		const conflicts = new Set<HTMLElement>();
		let hasConflict = false;
		let outOfBounds = false;

		this.iterateArea(area, (col, row) => {
			const gridValue = grid[col]?.[row];

			if (gridValue === undefined)
				return outOfBounds = true;

			if (gridValue.includes(element) && gridValue.length === 1) {
				return;
			}
			else {
				gridValue.forEach(v => {
					if (v !== element) {
						hasConflict = true;
						conflicts.add(v);
					}
				});
			}
		});

		return { hasConflict, outOfBounds, conflicts };
	}

	protected moveArea(grid: Grid, element: HTMLElement, area: Area) {
		// Reset map and grid for given area.
		const oldArea = this.gridLookup.get(element);
		if (oldArea) {
			// Remove the old references to the element in the grid.
			this.iterateArea(oldArea, (col, row) => {
				const arr = grid[col]![row]!;
				const index = arr.indexOf(element);
				arr.splice(index, 1);
			});
		}

		// Add the new references to the element in the grid.
		this.iterateArea(area, (col, row) => grid[col]![row]!.push(element));

		const [ rowStart, colStart, rowEnd, colEnd ] = this.areaToRanges(area);

		this.gridLookup.set(element, area);

		element.setAttribute('widget-rows', String(rowEnd - rowStart + 1));
		element.setAttribute('widget-columns', String(colEnd - colStart + 1));

		element.setAttribute('widget-area', area);
		element.style.gridArea = this.areaToGridArea(area);
	}

	protected cloneGrid(grid: Grid) {
		const clone: typeof grid = [];
		grid.forEach(col => clone.push(col.map(cell => cell.map(el => el))));

		return clone;
	}

	protected setColumns(width: number) {
		let newColumns = this.columns;

		if (width > (this.columnWidth * 8))
			newColumns = 8;
		else if (width > (this.columnWidth * 6))
			newColumns = 6;
		else if (width > (this.columnWidth * 4))
			newColumns = 4;
		else if (width > (this.columnWidth * 2))
			newColumns = 2;

		if (this.columns === newColumns)
			return;

		this.columns = newColumns;

		this.updateComplete.then(() => {
			const elements = new Set(this.shadowRoot!
				.querySelector('slot')!
				.assignedElements() as HTMLElement[]);

			elements.forEach(el => el.removeAttribute('widget-area'));

			this.initialize();
		});
	}

	protected initialize() {
		const elements = new Set(this.shadowRoot!
			.querySelector('slot')!
			.assignedElements() as HTMLElement[]);

		// Go through and assign the existing area to the areas that have one.
		// We then delete those elements from the set, so that we can lay out
		// the remaining elements according to remaining space.
		elements.forEach(el => {
			const existingArea = el.getAttribute('widget-area') as Area | null;
			if (existingArea) {
				this.moveArea(this.grid, el, existingArea);
				elements.delete(el);
			}
		});

		// Go through the elements that don't have an explicit area and assign
		// an available area.
		elements.forEach(el => {
			const minCols = el.getAttribute('widget-columns')
				? Number(el.getAttribute('widget-columns')) : 1;

			const minRows = el.getAttribute('widget-rows')
				? Number(el.getAttribute('widget-rows')) : 1;

			// Find all available positions in the grid for this widget.
			const possiblePositions: [col: number, row: number][] = [];
			this.grid.forEach((rows, colI) => rows.some((_, rowI) => {
				// We reduce ending col/row by 1 due to iterating by index
				const area = this.rangesToArea(
					colI, colI + minCols - 1,
					rowI, rowI + minRows - 1,
				);

				let enoughSpace = true;
				this.iterateArea(area, (col, row) => {
					if (this.grid[col]?.[row]?.length !== 0)
						enoughSpace = false;
				});

				const valid = enoughSpace;
				if (valid)
					possiblePositions.push([ colI, rowI ]);

				return valid;
			}));

			// Find the most suitable row/col out of the possible positions.
			const [ col, row ] = possiblePositions.reduce((acc, [ col, row ]) => {
				if (row < acc[1])
					acc = [ col, row ];

				return acc;
			}, [ Infinity, Infinity ] as [col: number, row: number]);

			// We reduce ending col/row by 1 due to iterating by index
			const widgetArea = this.rangesToArea(
				col, col + minCols - 1,
				row, row + minRows - 1,
			);

			this.moveArea(this.grid, el, widgetArea);
		});

		this.emitGridConfig();
	}
	//#endregion logic


	//#region lifecycle
	public override connectedCallback(): void {
		super.connectedCallback();

		const rect = this.getBoundingClientRect();
		this.setColumns(rect.width);

		this.addEventListener('mousedown', this.onMousedown);
		this.resizeCtrl.observe(this);
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.removeEventListener('mousedown', this.onMousedown);
		this.resizeCtrl.disconnect();
	}

	protected override willUpdate(props: Map<PropertyKey, unknown>): void {
		super.willUpdate(props);

		if (props.has('columns') || props.has('rows')) {
			this.grid = range(this.columns).map(() => range(this.rows).map(() => []));
			this.gridLookup.clear();
		}
	}
	//#endregion lifecycle


	//#region listeners
	protected onMousedown = (ev: MouseEvent) => {
		const path = ev.composedPath() as HTMLElement[];

		const isMover = path.some(el =>
			el instanceof Element && el.hasAttribute('widget-mover'));

		const isResizer = path.some(el =>
			el instanceof Element && el.hasAttribute('widget-resizer'));

		if (isMover)
			this.onMoverMousedown(ev, path);
		if (isResizer)
			this.onResizerMousedown(ev, path);
	};

	protected onMoverMousedown(ev: MouseEvent, path: HTMLElement[]) {
		ev.preventDefault();

		this.showGrid = true;

		const slottedElements = new Set(this.shadowRoot!
			.querySelector('slot')!
			.assignedElements());

		const elementToMove = path.find(el => slottedElements.has(el))!;

		const rect = elementToMove.getBoundingClientRect();

		const offsetY = ev.y - rect.top;
		const offsetX = ev.x - rect.left;

		const width = elementToMove.offsetWidth;
		const height = elementToMove.offsetHeight;

		let prevColRow = '';

		const onMousemove = (ev: MouseEvent) => {
			if (!ev.buttons)
				return onMouseup();

			Object.assign(elementToMove.style, {
				position:  'fixed',
				top:       ev.y - offsetY + 'px',
				left:      ev.x - offsetX + 'px',
				width:     width + 'px',
				height:    height + 'px',
				opacity:   '0.8',
				'z-index': 1,
			});

			const rect = elementToMove.getBoundingClientRect();
			const elements = this.shadowRoot!
				.elementsFromPoint(rect.left, rect.top) as HTMLElement[];

			const rowEl = elements.find(el => el.localName === 's-row' && el.id !== prevColRow);
			if (!rowEl)
				return;

			prevColRow = rowEl.id;

			const col = Number(rowEl.dataset['col']);
			const row = Number(rowEl.dataset['row']);

			const minCols = (elementToMove.getAttribute('widget-columns')
				? Number(elementToMove.getAttribute('widget-columns')) : 1) - 1;

			const minRows = (elementToMove.getAttribute('widget-rows')
				? Number(elementToMove.getAttribute('widget-rows')) : 1) - 1;

			// We reduce ending col/row by 1 due to iterating by index
			this.highlightValid(elementToMove, col, row, col + minCols, row + minRows);
		};

		const onMouseup = () => {
			// If there are any highlighted cells, we will move the area.
			if (this.highlightedArea) {
				this.moveArea(this.grid, elementToMove, this.highlightedArea);
				this.highlightedArea = undefined;
			}

			elementToMove.style.removeProperty('position');
			elementToMove.style.removeProperty('top');
			elementToMove.style.removeProperty('left');
			elementToMove.style.removeProperty('width');
			elementToMove.style.removeProperty('height');
			elementToMove.style.removeProperty('opacity');
			elementToMove.style.removeProperty('z-index');

			window.removeEventListener('mousemove', onMousemove);
			window.removeEventListener('mouseup', onMouseup);

			this.showGrid = false;

			this.emitGridConfig();
		};

		window.addEventListener('mousemove', onMousemove);
		window.addEventListener('mouseup', onMouseup);

		requestAnimationFrame(() => onMousemove(ev));
	}

	protected onResizerMousedown(ev: MouseEvent, path: HTMLElement[]) {
		ev.preventDefault();

		this.showGrid = true;

		const slottedElements = new Set(this.shadowRoot!
			.querySelector('slot')!
			.assignedElements());

		const elementToMove = path.find(el => slottedElements.has(el as any))!;

		const rect = elementToMove.getBoundingClientRect();

		const offsetY = ev.y - rect.bottom;
		const offsetX = ev.x - rect.right;

		let prevColRow = '';

		const onMousemove = (ev: MouseEvent) => {
			if (!ev.buttons)
				return onMouseup();

			const width = ev.x - rect.left - offsetX;
			const height = ev.y - rect.top - offsetY;

			Object.assign(elementToMove.style, {
				position:  'fixed',
				top:       rect.top + 'px',
				left:      rect.left + 'px',
				width:     width + 'px',
				height:    height + 'px',
				opacity:   '0.8',
				'z-index': 1,
			});

			const currentRect = elementToMove.getBoundingClientRect();
			const elements = this.shadowRoot!
				.elementsFromPoint(currentRect.right, currentRect.bottom) as HTMLElement[];

			const rowEl = elements.find(el => el.localName === 's-row' && el.id !== prevColRow);
			if (!rowEl)
				return;

			prevColRow = rowEl.id;

			const col = Number(rowEl.dataset['col']);
			const row = Number(rowEl.dataset['row']);

			const [ rowStart, colStart ] = this
				.areaToRanges(this.gridLookup.get(elementToMove)!);

			this.highlightValid(elementToMove, colStart, rowStart, col, row);
		};

		const onMouseup = () => {
			// If there are any highlighted cells, we will move the area.
			if (this.highlightedArea) {
				this.moveArea(this.grid, elementToMove, this.highlightedArea);
				this.highlightedArea = undefined;
			}

			elementToMove.style.removeProperty('position');
			elementToMove.style.removeProperty('top');
			elementToMove.style.removeProperty('left');
			elementToMove.style.removeProperty('width');
			elementToMove.style.removeProperty('height');
			elementToMove.style.removeProperty('opacity');
			elementToMove.style.removeProperty('z-index');

			window.removeEventListener('mousemove', onMousemove);
			window.removeEventListener('mouseup', onMouseup);

			this.showGrid = false;

			this.emitGridConfig();
		};

		window.addEventListener('mousemove', onMousemove);
		window.addEventListener('mouseup', onMouseup);

		requestAnimationFrame(() => onMousemove(ev));
	}

	protected onSlotChange() {
		this.initialize();
	}
	//#endregion listeners


	//#region template
	protected renderGrid(): unknown {
		let highlight: ((col: number, row: number) => boolean) | undefined;

		if (this.highlightedArea) {
			const ranges = this.areaToRanges(this.highlightedArea);

			highlight = (col: number, row: number) => {
				if (!ranges)
					return false;

				return inRange(col, ranges[1], ranges[3])
					&& inRange(row, ranges[0], ranges[2]);
			};
		}

		return map(this.grid, (rows, colI) => map(rows, (_, rowI) => {
			const gridArea = `${ rowI + 1 }/${ colI + 1 }/`
								+ `${ rowI + 2 }/${ colI + 2 }`;

			return html`
			<s-row
				id="${ colI }${ rowI }"
				style="grid-area:${ gridArea }"
				class=${ classMap({ highlight: !!highlight?.(colI, rowI) }) }
				data-row=${ rowI }
				data-col=${ colI }
			></s-row>
			`;
		}));
	}

	protected override render(): unknown {
		return html`
		<style>
			:host {
				--col-count: ${ this.columns };
				--row-count: ${ this.rows };
				--row-height: ${ this.rowHeight }px;
				--col-width: ${ this.columnWidth }px;
				--gap: 12px;
			}
			${ when(this.showGrid, () => 's-row { display: block !important; }') }
		</style>

		<!-- These are only for visually displaying the grid. -->
		${ this.renderGrid() }

		<slot @slotchange=${ this.onSlotChange }></slot>
		`;
	}
	//#endregion template


	//#region styles
	public static override styles = css`
	:host {
		overflow: hidden;
		overflow-y: auto;
		display: grid;
		justify-content: center;
		grid-template-rows: repeat(var(--row-count), var(--row-height));
		grid-template-columns: repeat(var(--col-count), minmax(0, var(--col-width)));
		gap: var(--gap);
	}
	s-row {
		display: none;
		background-color: rgb(80 100 50 / 10%);
	}
	s-row.highlight {
		background-color: rgb(80 100 50 / 70%);
	}
	`;
	//#endregion styles

}
