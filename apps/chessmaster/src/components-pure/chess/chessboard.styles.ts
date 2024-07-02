import { componentStyles } from '@eyeshare/web-components';
import { css } from 'lit';

/* ------------------------------------------------- */

export const chessboardStyle = [
	componentStyles,
	css`
	:host {
		display: block;
	}
	.base {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		grid-template-rows: repeat(8, 1fr);
		width: 500px;
		height: 500px;
		border: 1px solid white;
		border-radius: 8px;
		overflow: hidden;
	}
	.chessboard__tile {
		display: grid;
		place-items: center;
	}
	.chessboard__tile.white {
		background-color: rgb(180,180,180);
	}
	.chessboard__tile.black {
		background-color: brown;
	}
	.chessboard__piece {
		cursor: pointer;
	}
	.chessboard__piece es-icon {
		pointer-events: none;
	}
	.chessboard__available-move {
		pointer-events: none;
		display: grid;
		place-items: center;
		color: green;
	}
	`,
];
