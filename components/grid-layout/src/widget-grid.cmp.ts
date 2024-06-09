import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';


/** A string representing the grid area of a element. */
type Area = `${ string }/${ string }/${ string }/${ string }`;


const inRange = (val: number, from: number, to: number) => val >= from && val <= to;


const range = (length: number): undefined[] => {
	const arr: any[] = [];
	for (let i = 0; i < length; i++)
		arr.push(undefined);

	return arr;
};


@customElement('widget-grid')
export class WidgetGridCmp extends LitElement {

	@state() protected colCount = 5;
	@state() protected rowCount = 9;
	@state() protected highlightedArea?: Area;

	protected grid: (HTMLElement | true | null)[][] = [];
	protected gridMap = new Map<HTMLElement, Area>();


	protected printGrid(): void {
		const reOrdered: (HTMLElement | true | null)[][] = [];

		this.grid.forEach((rows, colI) => {
			rows.forEach((el, rowI) => {
				reOrdered[rowI] ??= [];
				reOrdered[rowI]![colI] = el;
			});
		});

		console.table(reOrdered);
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

	public override connectedCallback(): void {
		super.connectedCallback();

		this.addEventListener('mousedown', this.onMousedown, { autoDispose: true });
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.removeEventListener('mousedown', this.onMousedown);
	}

	protected override willUpdate(props: Map<PropertyKey, unknown>): void {
		super.willUpdate(props);

		if (props.has('colCount') || props.has('rowCount')) {
			this.gridMap.clear();
			this.grid = range(this.colCount)
				.map(() => range(this.rowCount).map(() => null));
		}
	}

	protected onMousedown = (ev: MouseEvent) => {
		const path = ev.composedPath();

		const isMover = path.some(el =>
			el instanceof Element && el.hasAttribute('widget-mover'));
		const isResizer = path.some(el =>
			el instanceof Element && el.hasAttribute('widget-resizer'));

		if (isMover)
			this.onMoverMousedown(ev, path);
		if (isResizer)
			this.onResizerMousedown(ev, path);
	};

	protected onMoverMousedown(ev: MouseEvent, path: EventTarget[]) {
		ev.preventDefault();

		const slottedElements = new Set(this.shadowRoot!
			.querySelector('slot')!
			.assignedElements());

		const elementToMove = path.find(el =>
			slottedElements.has(el as any)) as HTMLElement;

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

			const highlightValid = (ev: MouseEvent) => {
				const elements = this.shadowRoot!.elementsFromPoint(ev.x, ev.y) as HTMLElement[];
				const rowEl = elements.find(el => el.localName === 's-row' && el.id !== prevColRow);
				if (!rowEl)
					return;

				prevColRow = rowEl.id;

				const el = elementToMove;
				const minCols = el.getAttribute('widget-min-col')
					? Number(el.getAttribute('widget-min-col')) : 1;

				const minRows = el.getAttribute('widget-min-row')
					? Number(el.getAttribute('widget-min-row')) : 1;

				this.highlightedArea = undefined;

				const col = Number(rowEl.dataset['col']);
				const row = Number(rowEl.dataset['row']);

				// We reduce ending col/row by 1 due to iterating by index
				const targetArea = this.rangesToArea(
					col, col + minCols - 1,
					row, row + minRows - 1,
				);

				let enoughSpace = true;
				this.iterateArea(targetArea, (col, row) => {
					const gridValue = this.grid[col]?.[row];

					if (gridValue === elementToMove)
						return;

					if (gridValue || gridValue === undefined)
						enoughSpace = false;
				});

				if (enoughSpace)
					this.highlightedArea = targetArea;

				this.requestUpdate();
			};

			highlightValid(ev);
		};
		const onMouseup = () => {
			// If there are any highlighted cells, we will move the area.
			if (this.highlightedArea) {
				// Reset map and grid for given area.
				const oldArea = elementToMove.getAttribute('widget-area') as Area;
				this.iterateArea(oldArea, (col, row) => {
					this.grid[col]![row] = null;
				});

				this.iterateArea(this.highlightedArea, (col, row) => {
					this.grid[col]![row] = elementToMove;
				});

				this.gridMap.set(elementToMove, this.highlightedArea);

				elementToMove.setAttribute('widget-area', this.highlightedArea);
				elementToMove.style.gridArea = this.areaToGridArea(this.highlightedArea);

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

			this.printGrid();
		};

		window.addEventListener('mousemove', onMousemove);
		window.addEventListener('mouseup', onMouseup);
	}

	protected onResizerMousedown(_ev: MouseEvent, _path: EventTarget[]) {
		console.log('is a resizer');
	}

	protected onSlotChange(ev: Event) {
		const target = ev.target as HTMLSlotElement;
		const elements = target.assignedElements() as HTMLElement[];

		elements.forEach(el => {
			if (this.gridMap.has(el))
				return;

			const minCols = el.getAttribute('widget-min-col')
				? Number(el.getAttribute('widget-min-col')) : 1;

			const minRows = el.getAttribute('widget-min-row')
				? Number(el.getAttribute('widget-min-row')) : 1;

			// Find all available positions in the grid for this widget.
			const possiblePositions: [col: number, row: number][] = [];
			this.grid.forEach((rows, colI) => {
				rows.some((_, rowI) => {
					// We reduce ending col/row by 1 due to iterating by index
					const area = this.rangesToArea(
						colI, colI + minCols - 1,
						rowI, rowI + minRows - 1,
					);

					let enoughSpace = true;
					this.iterateArea(area, (col, row) => {
						if (this.grid[col]?.[row] || this.grid[col]?.[row] === undefined)
							enoughSpace = false;
					});

					const valid = enoughSpace;
					if (valid)
						possiblePositions.push([ colI, rowI ]);

					return valid;
				});
			});

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

			// Set the row and column as occupied.
			this.iterateArea(widgetArea, (col, row) => {
				this.grid[col]![row] = el;
			});

			// Map the col/row from-to directly to the element.
			this.gridMap.set(el, widgetArea);

			// Assign the widget area attribute, this one uses 0 based indexing
			// as we use it for operating on the internal arrays.
			el.setAttribute('widget-area', widgetArea);

			// Assign the styles that position the element.
			// We add + 1 to each value as grid uses 1 based indexing.
			Object.assign(el.style, { gridArea: this.areaToGridArea(widgetArea) });
		});

		this.printGrid();
	}

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
			>${ gridArea }</s-row>
			`;
		}));
	}

	protected override render() {
		return html`
		<style>
			:host {
				--col-count: ${ this.colCount };
				--row-count: ${ this.rowCount };
			}
		</style>

		<!-- These are only for visually displaying the grid. -->
		${ this.renderGrid() }

		<slot @slotchange=${ this.onSlotChange }></slot>
		`;
	}

	public static override styles = css`
	:host {
		--row-height: 100px;
		--col-width: 200px;
		--gap: 12px;

		display: grid;
		justify-content: center;
		grid-template-columns: repeat(var(--col-count), minmax(0, var(--col-width)));
		grid-template-rows: repeat(var(--row-count), var(--row-height));
		gap: var(--gap);
	}
	s-row {
		display: block;
		background-color: rgb(80 100 50 / 10%);
	}
	s-row.highlight {
		background-color: rgb(80 100 50 / 70%);
	}
	`;

}
