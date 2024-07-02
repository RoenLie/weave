import { BoardLocation, Gamestate } from './chess.types.js';
import { createTileInfo } from './chess.utils.js';


export const initialGamestate: Gamestate = [
	[ 'a8', { name: 'rook', color: 'black' } ],
	[ 'b8', { name: 'knight', color: 'black' } ],
	[ 'c8', { name: 'bishop', color: 'black'  } ],
	[ 'd8', { name: 'queen', color: 'black'  } ],
	[ 'e8', { name: 'king', color: 'black'  } ],
	[ 'f8', { name: 'bishop', color: 'black'  } ],
	[ 'g8', { name: 'knight', color: 'black'  } ],

	[ 'h8', { name: 'rook', color: 'black'  } ],
	[ 'a7', { name: 'pawn', color: 'black'  } ],
	[ 'b7', { name: 'pawn', color: 'black'  } ],
	[ 'c7', { name: 'pawn', color: 'black'  } ],
	[ 'd7', { name: 'pawn', color: 'black'  } ],
	[ 'e7', { name: 'pawn', color: 'black'  } ],
	[ 'f7', { name: 'pawn', color: 'black'  } ],
	[ 'g7', { name: 'pawn', color: 'black'  } ],
	[ 'h7', { name: 'pawn', color: 'black'  } ],

	[ 'a2', { name: 'pawn', color: 'white'  } ],
	[ 'b2', { name: 'pawn', color: 'white'  } ],
	[ 'c2', { name: 'pawn', color: 'white'  } ],
	[ 'd2', { name: 'pawn', color: 'white'  } ],
	[ 'e2', { name: 'pawn', color: 'white'  } ],
	[ 'f2', { name: 'pawn', color: 'white'  } ],
	[ 'g2', { name: 'pawn', color: 'white'  } ],
	[ 'h2', { name: 'pawn', color: 'white'  } ],

	[ 'a1', { name: 'rook', color: 'white'  } ],
	[ 'b1', { name: 'knight', color: 'white'  } ],
	[ 'c1', { name: 'bishop', color: 'white'  } ],
	[ 'd1', { name: 'king', color: 'white'  } ],
	[ 'e1', { name: 'queen', color: 'white'  } ],
	[ 'f1', { name: 'bishop', color: 'white'  } ],
	[ 'g1', { name: 'knight', color: 'white'  } ],
	[ 'h1', { name: 'rook', color: 'white'  } ],
];


export const letterArray = [ '', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h' ];


export const tileGridLocation = new Map<BoardLocation, [row: string, column: string]>([
	...Array(8 * 8).fill(null).map((_, i) => {
		let { row, letter, gridRow, gridColumn } = createTileInfo(i);

		return [
			letter + row,
			[ gridRow, gridColumn ] as [row: string, column: string],
		] as const;
	}),
]);
