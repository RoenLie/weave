import { letterArray } from './chess.constants.js';


export const createTileInfo = (index: number) => {
	let column = index % 8 + 1;
	let row = Math.trunc(index / 8) + 1;
	let letter = letterArray[column]!.toUpperCase();
	let gridRow = [ 8 - (row - 1), 8 - (row - 1) + 1 ].join('/');
	let gridColumn = [ column, column + 1 ].join('/');

	return { column, row, letter, gridRow, gridColumn };
};


export const parity = (num: number) => num % 2 == 0 ? 'even' : 'odd';


export const isUpper = (str: string) => str === str.toUpperCase();


export const isLower = (str: string) => str === str.toLowerCase();
