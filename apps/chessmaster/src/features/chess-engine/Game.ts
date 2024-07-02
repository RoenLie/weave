import { Board } from './Board.js';
import { PIECES } from './constants/board.constant.js';
import { AILevel, BoardConfiguration, BoardLocation, Piece } from './types.js';
import { getFEN, printToConsole } from './utils.js';


export class Game {

	public board: Board;

	constructor(configuration?: BoardConfiguration | string) {
		this.board = new Board(configuration);
	}

	public move(from: BoardLocation, to: BoardLocation) {
		from = from.toUpperCase();
		to = to.toUpperCase();
		const possibleMoves = this.board.getMoves();
		if (!possibleMoves[from] || !possibleMoves[from]?.includes(to))
			throw new Error(`Invalid move from ${ from } to ${ to } for ${ this.board.getPlayingColor() }`);

		this.board.addMoveToHistory(from, to);
		this.board.move(from, to);

		return { [from]: to };
	}

	public moves<T extends BoardLocation | undefined>(from?: T): T extends undefined ? Partial<Record<BoardLocation, BoardLocation[]>> : BoardLocation[] {
		const allMoves = this.board.getMoves();
		if (!from)
			return allMoves as any;

		return (from ? this.board.getMoves()[from.toUpperCase()] : this.board.getMoves()) || [] as any;
	}

	public setPiece(location: BoardLocation, piece: Piece) {
		this.board.setPiece(location, piece);
	}

	public removePiece(location: BoardLocation) {
		this.board.removePiece(location);
	}

	public aiMove(level: AILevel = 2) {
		const move = this.board.calculateAiMove(level);

		return this.move(move.from, move.to);
	}

	public getHistory(reversed = false) {
		return reversed ? this.board.history.reverse() : this.board.history;
	}

	public printToConsole() {
		printToConsole(this.board.configuration);
	}

	public exportJson() {
		return this.board.exportJson();
	}

	public exportFEN() {
		return getFEN(this.board.configuration);
	}

}


export const moves = (config: BoardConfiguration) => {
	if (!config)
		throw new Error('Configuration param required.');

	const game = new Game(config);

	return game.moves();
};


export const status = (config: BoardConfiguration) => {
	if (!config)
		throw new Error('Configuration param required.');

	const game = new Game(config);

	return game.exportJson();
};


export const getFen = (config: BoardConfiguration) => {
	const game = new Game(config);

	return game.exportFEN();
};


export const move = (config: BoardConfiguration, from: BoardLocation, to: BoardLocation) => {
	const game = new Game(config);
	game.move(from, to);
	if (typeof config === 'object')
		return game.exportJson();
	else
		return game.exportFEN();
};


export const aiMove = (config: BoardConfiguration, level: AILevel = 2) => {
	const game = new Game(config);
	const move = game.board.calculateAiMove(level);

	return { [move.from]: move.to };
};
