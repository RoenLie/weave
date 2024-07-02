import { range } from '../utils/array/range.js';
import { iterate } from '../utils/iterators/iterator-pipeline.js';
import { lazyMap } from '../utils/structs/lazy-map.js';
import { getEqualItems } from '../utils/structs/sets-have-same-items.js';
import { findNakedSubset } from './find-naked-subset.js';


export interface SudokuCell {
	id: `y=${ number },x=${ number }`;
	x: number;
	y: number;
	box: SudokuCell[];
	row: SudokuCell[];
	column: SudokuCell[];
	validators: Set<SudokuCell>;
	candidates: Set<number>;
	value: number;
}

export type SudokuChange = {
	type: 'assignment';
	x: number;
	y: number;
	value: number;
} | {
	type: 'candidate';
	x: number;
	y: number;
	value: number;
}


export class SudokuSolver {

	public output: {
		grid: number[][];
		candidates: number[][][];
		changes: SudokuChange[];
	} = {
			grid:       [],
			candidates: [],
			changes:    [],
		};

	protected grid: number[][];
	public size: number;
	public blockSize: number;

	protected boxes: SudokuCell[][][] = [];
	public columns: SudokuCell[][] = [];
	public rows: SudokuCell[][] = [];
	protected cells: SudokuCell[] = [];
	protected allCandidates: Set<number>;

	constructor(sudoku: number[][] | { sudoku: string; delimiter: string; }) {
		// Check if the input is an array of arrays or an object with 'sudoku' and 'delimiter' properties.
		if (Array.isArray(sudoku)) {
			// If it's an array of arrays, assign it directly to the grid.
			this.grid = sudoku;
		}
		else {
			// If it's an object, split the 'sudoku' string into an array of arrays based on the delimiter.
			this.grid = sudoku.sudoku
				.trim()
				.split('\n')
				.filter(Boolean)
				.map(s => s.split(sudoku.delimiter).map(n => Number(n.trim())));
		}

		// Store the initial grid state.
		this.output.grid = this.grid;

		// Set the size of the Sudoku grid based on the length of the input.
		this.size = this.grid.length;
		// Calculate the blockSize (the size of each block/region) by finding the square root of the size.
		this.blockSize = Math.sqrt(this.size);

		// Check if the blockSize is an integer, otherwise throw an error.
		if (this.blockSize % 1 != 0)
			throw ('Invalid Sudoku size');

		// Generate a range of numbers from 1 to the size of the Sudoku grid.
		this.allCandidates = new Set(range(1, this.size + 1));

		// Loop through the rows of the grid.
		for (let rowIndex = 0; rowIndex < this.grid.length; rowIndex++) {
			const row = this.grid[rowIndex]!;
			// Loop through the columns of each row.
			for (let colIndex = 0; colIndex < row.length; colIndex++) {
				const col = row[colIndex]!;

				// Initialize a cell object.
				const cell: Partial<SudokuCell> = {
					id:         `y=${ rowIndex },x=${ colIndex }`,
					x:          colIndex,
					y:          rowIndex,
					value:      col,
					candidates: new Set(col ? [] : this.allCandidates),
					validators: new Set<SudokuCell>(),
				};

				// Setup initial candidates
				this.output.candidates[rowIndex] ??= [];
				this.output.candidates[rowIndex]![colIndex] ??= [ ...cell.candidates! ];

				// Add the cell to the corresponding column.
				this.columns[colIndex] ??= [];
				this.columns[colIndex]![rowIndex] = cell as SudokuCell;

				// Add the cell to the corresponding row.
				this.rows[rowIndex] ??= [];
				this.rows[rowIndex]![colIndex] = cell as SudokuCell;

				// Assign row and column references to the cell.
				cell.row = this.rows[rowIndex];
				cell.column = this.columns[colIndex];

				// Add the cell to the cells Map.
				this.cells.push(cell as SudokuCell);

				// Calculate the block indices
				const blockRow = Math.floor(rowIndex / this.blockSize);
				const blockCol = Math.floor(colIndex / this.blockSize);

				this.boxes[blockRow] ??= [];
				this.boxes[blockRow]![blockCol] ??= [];
				this.boxes[blockRow]![blockCol]!.push(cell as SudokuCell);

				// Assign the box reference to the cell.
				cell.box = this.boxes[blockRow]![blockCol];
			}
		}

		this.cells.forEach(cell => {
			cell.box.forEach(c => cell.validators.add(c));
			cell.row.forEach(c => cell.validators.add(c));
			cell.column.forEach(c => cell.validators.add(c));
		});
	}

	protected updateCellValue(cell: SudokuCell, value: number) {
		cell.value = value;

		this.output.changes.push({
			type:  'assignment',
			x:     cell.x,
			y:     cell.y,
			value: cell.value,
		});
	}

	protected removeCellCandidate(cell: SudokuCell, value: number) {
		cell.candidates.delete(value);

		this.output.changes.push({
			type: 'candidate',
			x:    cell.x,
			y:    cell.y,
			value,
		});
	}

	// Loops through all cells and removes invalid candidates.
	public removeInvalidCandidates() {
		for (const cell of this.cells) {
			if (!cell.candidates.size)
				continue;

			cell.validators.forEach(c => {
				if (c === cell || !c.value)
					return;

				if (cell.candidates.has(c.value))
					this.removeCellCandidate(cell, c.value);
			});
		}
	}

	public applyNakedSingles() {
		for (const cell of this.cells) {
			if (cell.candidates.size === 1) {
				const value = cell.candidates.values().next().value;

				this.removeCellCandidate(cell, value);
				this.updateCellValue(cell, value);
			}
		}
	}

	//public applyNakedGroup(size: number) {
	//	const trim = (cells: SudokuCell[], size: number) => {
	//		const candidates = iterate(cells)
	//			.pipe(c => c.candidates.size !== size ? undefined : c)
	//			.toArray();

	//		if (candidates.length === 2) {
	//			if (setsHaveSameItems(...candidates.map(c => c.candidates))) {
	//				const values = [ ...candidates[0]!.candidates.values() ];

	//				cells.forEach(rowCell => {
	//					if (candidates.includes(rowCell))
	//						return;

	//					values.forEach(v => this.removeCellCandidate(rowCell, v));
	//				});
	//			}
	//		}
	//	};

	//	for (const cell of this.cells) {
	//		if (!cell.candidates.size)
	//			continue;

	//		trim(cell.column, size);
	//		trim(cell.row, size);
	//		trim(cell.box, size);
	//	}
	//}

	public applyNakedGroup(size: number) {
		for (const cell of this.cells) {
			if (!cell.candidates.size)
				continue;

			const naked = findNakedSubset(cell.column.map(c => [ ...c.candidates ]), size);

			console.log(naked);


			//trim(cell.column, size);
			//trim(cell.row, size);
			//trim(cell.box, size);
		}
	}

	public applyHiddenGroup(size: number) {
		console.log('looking for hidden groups');

		size = size + 1;

		const trim = (cells: SudokuCell[], size: number) => {
			const candidates = iterate(cells)
				.pipe(c => c.candidates.size !== size ? undefined : c)
				.toArray();

			if (candidates.length === size) {
				console.log(candidates);

				const equalNumbers = getEqualItems(2, ...candidates.map(c => c.candidates));

				console.log(equalNumbers);
			}
		};

		for (const cell of this.cells) {
			if (!cell.candidates.size)
				return;

			trim(cell.box, size);
			trim(cell.row, size);
			trim(cell.column, size);
		}
	}

	public findEmptyCell() {
		const cell = this.cells.find(c => !c.value);
		if (!cell)
			return {};

		const candidates = new Set<number>(cell.candidates);
		cell?.validators.forEach(c => {
			if (c.value && c !== cell)
				candidates.delete(c.value);
		});

		return { cell, candidates };
	}

	public bruteForce() {
		const { cell, candidates } = this.findEmptyCell() ?? {};
		if (!cell)
			return true;

		for (const candidate of candidates) {
			this.updateCellValue(cell, candidate);

			if (this.bruteForce())
				return true;

			this.updateCellValue(cell, 0);
		}

		return false;
	}

	public printCells() {
		const tbl: string[][] = [];

		this.cells.forEach(cell => {
			const x = parseInt(/x=(\d+)/.exec(cell.id)![1]!);
			const y = parseInt(/y=(\d+)/.exec(cell.id)![1]!);

			tbl[y] ??= [];
			tbl[y]![x] = `${ cell.value }`;
		});

		console.table(tbl);
	}

	public solve() {
		this.removeInvalidCandidates();
		this.applyNakedSingles();
		this.applyNakedGroup(5);
		//this.applyNakedGroup(3);
		//this.applyNakedGroup(4);

		//this.applyHiddenGroup(3);

		this.bruteForce();
		//this.printCells();

		//console.log(this.cells);

		return;
	}

}


const findSetDifference = (allNumbers: Set<number>, invalidNumbers: Set<number>) => {
	const validNumbers = new Set<number>();

	for (const num of allNumbers) {
		if (!invalidNumbers.has(num))
			validNumbers.add(num);
	}

	return validNumbers;
};


const findDuplicateSets = (arr: SudokuCell[], size: number) => {
	const duplicates = new Set<SudokuCell>();
	const setStrings = new Map<string, number>();
	const stringToObject = new Map<string, SudokuCell[]>();

	arr.forEach((obj) => {
		if (obj.candidates.size !== size)
			return;

		const sortedNumbers = Array.from(obj.candidates).sort((a, b) => a - b);
		const setStr = JSON.stringify(sortedNumbers);

		const count = setStrings.get(setStr) ?? 0;
		setStrings.set(setStr, count + 1);

		const objects = lazyMap(stringToObject, setStr, () => []);
		objects.push(obj);
	});

	setStrings.forEach((count, setStr) => {
		if (count === size) {
			const duplicateObj = stringToObject.get(setStr);
			duplicateObj?.forEach(obj => duplicates.add(obj));
		}
	});

	return duplicates;
};
