import { invariant } from '@eyeshare/shared';

import {
	AI_DEPTH_BY_LEVEL,
	AI_LEVELS,
	COLORS,
	down,
	downByColor,
	downLeft,
	downLeftByColor,
	downLeftDown,
	downLeftLeft,
	downRight,
	downRightByColor,
	downRightDown,
	downRightRight,
	left,
	NEW_GAME_BOARD_CONFIG,
	NEW_GAME_SETTINGS,
	right,
	scoreByPosition,
	up,
	upByColor,
	upLeft,
	upLeftByColor,
	upLeftLeft,
	upLeftUp,
	upRight,
	upRightByColor,
	upRightRight,
	upRightUp,
} from './constants/board.constant.js';
import { AILevel, BoardConfiguration, BoardLocation, Piece, PieceColor, PieceLocation } from './types.js';
import { getJSONfromFEN, getPieceValue, isLocationValid, isPieceValid } from './utils.js';


const SCORE = {
	MIN: -1000,
	MAX: 1000,
};


const PIECE_VALUE_MULTIPLIER = 10;


export class Board {

	public history: {from: BoardLocation; to: BoardLocation; configuration: BoardConfiguration}[] = [];

	public configuration: Required<BoardConfiguration>;

	constructor(configuration?: BoardConfiguration | string) {
		const fullConfig = configuration
			? configuration
			: structuredClone(NEW_GAME_BOARD_CONFIG) as Required<BoardConfiguration>;

		if (typeof fullConfig === 'object')
			this.configuration = { ...NEW_GAME_SETTINGS, ...fullConfig } as Required<BoardConfiguration>;
		else if (typeof fullConfig === 'string')
			this.configuration = { ...NEW_GAME_SETTINGS, ...getJSONfromFEN(fullConfig) } as Required<BoardConfiguration>;
		else
			throw new Error(`Unknown configuration type ${ typeof configuration }.`);

		this.configuration.castling ?? (this.configuration.castling = {
			whiteShort: true,
			blackShort: true,
			whiteLong:  true,
			blackLong:  true,
		});
	}

	public getAttackingFields(color = this.getPlayingColor()) {
		let attackingFields: BoardLocation[] = [];
		for (const location in this.configuration.pieces) {
			const piece = this.getPiece(location);
			invariant(piece, `no piece in requested location: ${ location }`);

			if (this.getPieceColor(piece) === color)
				attackingFields = [ ...attackingFields, ...this.getPieceMoves(piece, location) ];
		}

		return attackingFields;
	}

	public isAttackingKing(color = this.getPlayingColor()) {
		for (const location in this.configuration.pieces) {
			const piece = this.getPiece(location);
			invariant(piece, `no piece in requested location: ${ location }`);

			if (this.isKing(piece) && this.getPieceColor(piece) !== color)
				return this.isPieceUnderAttack(location);
		}

		return false;
	}

	public isPieceUnderAttack(pieceLocation: BoardLocation) {
		const playerColor = this.getPieceOnLocationColor(pieceLocation);
		invariant(playerColor, `No piece found at location ${ pieceLocation }`);

		const enemyColor = this.getEnemyColor(playerColor);
		let isUnderAttack = false;

		let field: BoardLocation | null = pieceLocation;
		let distance = 0;

		// Is under attack from above
		while (up(field) && !isUnderAttack) {
			field = up(field);
			distance++;
			const piece = this.getPiece(field);
			if (!piece)
				continue;

			const isEnemy = this.getPieceColor(piece) === enemyColor;
			const isRook = this.isRook(piece);
			const isQueen = this.isQueen(piece);
			const isKing = this.isKing(piece);
			isUnderAttack = isEnemy && (isRook || isQueen || (isKing && distance === 1));

			break;
		}

		// is under attack from below
		field = pieceLocation;
		distance = 0;
		while (down(field) && !isUnderAttack) {
			field = down(field);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1)))
				isUnderAttack = true;

			if (piece)
				break;
		}


		// is under attack from the left
		field = pieceLocation;
		distance = 0;
		while (left(field) && !isUnderAttack) {
			field = left(field);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1)))
				isUnderAttack = true;

			if (piece)
				break;
		}


		// is under attack from the right
		field = pieceLocation;
		distance = 0;
		while (right(field) && !isUnderAttack) {
			field = right(field);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isRook(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1)))
				isUnderAttack = true;

			if (piece)
				break;
		}


		// is under attack from up right
		field = pieceLocation;
		distance = 0;
		while (upRightByColor(field, playerColor) && !isUnderAttack) {
			field = upRightByColor(field, playerColor);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isBishop(piece) || this.isQueen(piece) || (distance === 1 && (this.isKing(piece) || this.isPawn(piece)))))
				isUnderAttack = true;

			if (piece)
				break;
		}

		// is under attack from up left
		field = pieceLocation;
		distance = 0;
		while (upLeftByColor(field, playerColor) && !isUnderAttack) {
			field = upLeftByColor(field, playerColor);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isBishop(piece) || this.isQueen(piece) || (distance === 1 && (this.isKing(piece) || this.isPawn(piece)))))
				isUnderAttack = true;

			if (piece)
				break;
		}

		// is under attack from down right
		field = pieceLocation;
		distance = 0;
		while (downRightByColor(field, playerColor) && !isUnderAttack) {
			field = downRightByColor(field, playerColor);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isBishop(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1)))
				isUnderAttack = true;

			if (piece)
				break;
		}

		// is under attack from down left
		field = pieceLocation;
		distance = 0;
		while (downLeftByColor(field, playerColor) && !isUnderAttack) {
			field = downLeftByColor(field, playerColor);
			distance++;
			const piece = this.getPiece(field);
			if (piece && this.getPieceColor(piece) === enemyColor &&
				(this.isBishop(piece) || this.isQueen(piece) || (this.isKing(piece) && distance === 1)))
				isUnderAttack = true;

			if (piece)
				break;
		}


		// is under attack from knight
		field = upRightUp(pieceLocation);
		let piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = upRightRight(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = upLeftLeft(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = upLeftUp(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = downLeftDown(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = downLeftLeft(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = downRightDown(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;

		// is under attack from knight
		field = downRightRight(pieceLocation);
		piece = this.getPiece(field);
		if (piece && this.getPieceColor(piece) === enemyColor && this.isKnight(piece))
			isUnderAttack = true;


		return isUnderAttack;
	}

	public hasPlayingPlayerCheck() {
		return this.isAttackingKing(this.getNonPlayingColor());
	}

	public hasNonPlayingPlayerCheck() {
		return this.isAttackingKing(this.getPlayingColor());
	}

	public getLowestValuePieceAttackingLocation(location: BoardLocation, color = this.getPlayingColor()) {
		let pieceValue: number | null = null;
		for (const field in this.configuration.pieces) {
			const piece = this.getPiece(field)!;
			if (this.getPieceColor(piece) === color) {
				this.getPieceMoves(piece, field).map(attackingLocation => {
					if (attackingLocation === location && (pieceValue === null || getPieceValue(piece) < pieceValue))
						pieceValue = getPieceValue(piece);
				});
			}
		}

		return pieceValue;
	}

	public getMoves(color = this.getPlayingColor(), movablePiecesRequiredToSkipTest: number | null = null) {
		const allMoves: Partial<Record<BoardLocation, BoardLocation[]>> = {};
		let movablePiecesCount = 0;
		for (const location in this.configuration.pieces) {
			const piece = this.getPiece(location);
			invariant(piece, `no piece at location: ${ location }`);

			if (this.getPieceColor(piece) === color) {
				const moves = this.getPieceMoves(piece, location);
				if (moves.length)
					movablePiecesCount++;


				Object.assign(allMoves, { [location]: moves });
			}
		}

		const enemyAttackingFields = this.getAttackingFields(this.getNonPlayingColor());
		if (this.isLeftCastlingPossible(enemyAttackingFields)) {
			if (this.isPlayingWhite())
				allMoves.E1?.push('C1');
			if (this.isPlayingBlack())
				allMoves.E8?.push('C8');
		}
		if (this.isRightCastlingPossible(enemyAttackingFields)) {
			if (this.isPlayingWhite())
				allMoves.E1?.push('G1');
			if (this.isPlayingBlack())
				allMoves.E8?.push('G8');
		}

		if (movablePiecesRequiredToSkipTest && movablePiecesCount > movablePiecesRequiredToSkipTest)
			return allMoves;

		const moves: Partial<Record<BoardLocation, BoardLocation[]>> = {};
		for (const from in allMoves) {
			allMoves[from]?.map(to => {
				const testConfiguration: BoardConfiguration = structuredClone(this.configuration);
				const testBoard = new Board(testConfiguration);
				testBoard.move(from, to);

				if (
					(this.isPlayingWhite() && !testBoard.isAttackingKing(COLORS.BLACK)) ||
					(this.isPlayingBlack() && !testBoard.isAttackingKing(COLORS.WHITE))
				) {
					if (!moves[from])
						moves[from] = [];

					moves[from]?.push(to);
				}
			});
		}

		if (!Object.keys(moves).length) {
			this.configuration.isFinished = true;
			if (this.hasPlayingPlayerCheck())
				this.configuration.checkMate = true;
		}

		return moves;
	}

	public isLeftCastlingPossible(enemyAttackingFields: BoardLocation[]) {
		if (this.isPlayingWhite() && !this.configuration.castling.whiteLong)
			return false;
		if (this.isPlayingBlack() && !this.configuration.castling.blackLong)
			return false;

		let kingLocation = null;
		if (
			this.isPlayingWhite() &&
			this.getPiece('E1') === 'K' &&
			this.getPiece('A1') === 'R' && !enemyAttackingFields.includes('E1')
		)
			kingLocation = 'E1';
		else if (
			this.isPlayingBlack() &&
			this.getPiece('E8') === 'k' &&
			this.getPiece('A8') === 'r' &&
			!enemyAttackingFields.includes('E8')
		)
			kingLocation = 'E8';
		if (!kingLocation)
			return false;

		let field = left(kingLocation);
		if (this.getPiece(field) || enemyAttackingFields.includes(field))
			return false;

		field = left(field);
		if (this.getPiece(field) || enemyAttackingFields.includes(field))
			return false;

		field = left(field);
		if (this.getPiece(field))
			return false;

		return true;
	}

	public isRightCastlingPossible(enemyAttackingFields: BoardLocation[]) {
		if (this.isPlayingWhite() && !this.configuration.castling.whiteShort)
			return false;
		if (this.isPlayingBlack() && !this.configuration.castling.blackShort)
			return false;

		let kingLocation = null;
		if (this.isPlayingWhite() && this.getPiece('E1') === 'K' && this.getPiece('H1') === 'R' && !enemyAttackingFields.includes('E1'))
			kingLocation = 'E1';
		else if (this.isPlayingBlack() && this.getPiece('E8') === 'k' && this.getPiece('H8') === 'r' && !enemyAttackingFields.includes('E8'))
			kingLocation = 'E8';

		if (!kingLocation)
			return false;

		let field = right(kingLocation);
		if (this.getPiece(field) || enemyAttackingFields.includes(field))
			return false;

		field = right(field);
		if (this.getPiece(field) || enemyAttackingFields.includes(field))
			return false;

		return true;
	}

	public getPieceMoves(piece: Piece, location: BoardLocation) {
		if (this.isPawn(piece))
			return this.getPawnMoves(piece, location);
		if (this.isKnight(piece))
			return this.getKnightMoves(piece, location);
		if (this.isRook(piece))
			return this.getRookMoves(piece, location);
		if (this.isBishop(piece))
			return this.getBishopMoves(piece, location);
		if (this.isQueen(piece))
			return this.getQueenMoves(piece, location);
		if (this.isKing(piece))
			return this.getKingMoves(piece, location);

		return [];
	}

	public isPawn(piece: Piece) {
		return piece.toUpperCase() === 'P';
	}

	public isKnight(piece: Piece) {
		return piece.toUpperCase() === 'N';
	}

	public isRook(piece: Piece) {
		return piece.toUpperCase() === 'R';
	}

	public isBishop(piece: Piece) {
		return piece.toUpperCase() === 'B';
	}

	public isQueen(piece: Piece) {
		return piece.toUpperCase() === 'Q';
	}

	public isKing(piece: Piece) {
		return piece.toUpperCase() === 'K';
	}

	public getPawnMoves(piece: Piece, location: BoardLocation) {
		const moves = [];
		const color = this.getPieceColor(piece);
		let move = upByColor(location, color);

		const isInStartLine = (color: PieceColor, location: PieceLocation) => {
			const row = location![1]!;
			if (color === COLORS.WHITE && row === '2')
				return true;
			if (color === COLORS.BLACK && row === '7')
				return true;

			return false;
		};

		if (move && !this.getPiece(move)) {
			moves.push(move);
			move = upByColor(move, color);
			if (isInStartLine(color, location) && move && !this.getPiece(move))
				moves.push(move);
		}

		//if (location === 'E5')
		//	console.log(this.configuration.enPassant);

		move = upLeftByColor(location, color);
		if (move && ((this.getPiece(move) && this.getPieceOnLocationColor(move) !== color) || (move === this.configuration.enPassant)))
			moves.push(move);

		move = upRightByColor(location, color);
		if (move && ((this.getPiece(move) && this.getPieceOnLocationColor(move) !== color) || (move === this.configuration.enPassant)))
			moves.push(move);

		return moves;
	}

	public getKnightMoves(piece: Piece, location: BoardLocation) {
		const moves = [];
		const color = this.getPieceColor(piece);

		let field = upRightUp(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = upRightRight(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = upLeftUp(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = upLeftLeft(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = downLeftLeft(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = downLeftDown(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = downRightRight(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = downRightDown(location);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		return moves;
	}

	public getRookMoves(piece: Piece, location: BoardLocation) {
		const moves = [];
		const color = this.getPieceColor(piece);

		let field = location;
		while (up(field)) {
			field = up(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		field = location;
		while (down(field)) {
			field = down(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		field = location;
		while (right(field)) {
			field = right(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		field = location;
		while (left(field)) {
			field = left(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		return moves;
	}

	public getBishopMoves(piece: Piece, location: BoardLocation) {
		const moves = [];
		const color = this.getPieceColor(piece);

		let field = location;
		while (upLeft(field)) {
			field = upLeft(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		field = location;
		while (upRight(field)) {
			field = upRight(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		field = location;
		while (downLeft(field)) {
			field = downLeft(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		field = location;
		while (downRight(field)) {
			field = downRight(field);
			const pieceOnFieldColor = this.getPieceOnLocationColor(field);
			if (this.getPieceOnLocationColor(field) !== color)
				moves.push(field);

			if (pieceOnFieldColor)
				break;
		}

		return moves;
	}

	public getQueenMoves(piece: Piece, location: BoardLocation) {
		const moves = [
			...this.getRookMoves(piece, location),
			...this.getBishopMoves(piece, location),
		];

		return moves;
	}

	public getKingMoves(piece: Piece, location: BoardLocation) {
		const moves = [];
		const color = this.getPieceColor(piece);

		let field = location;
		field = up(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = right(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = down(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = left(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = upLeft(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = upRight(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = downLeft(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		field = location;
		field = downRight(field);
		if (field && this.getPieceOnLocationColor(field) !== color)
			moves.push(field);


		return moves;
	}

	public getPieceColor(piece: Piece) {
		if (piece.toUpperCase() === piece)
			return COLORS.WHITE;

		return COLORS.BLACK;
	}

	public getPieceOnLocationColor(location: BoardLocation) {
		const piece = this.getPiece(location);
		if (!piece)
			return null;

		return piece.toUpperCase() === piece ? COLORS.WHITE : COLORS.BLACK;
	}

	public getPiece(location: BoardLocation) {
		return this.configuration.pieces[location];
	}

	public setPiece(location: BoardLocation, piece: Piece) {
		if (!isPieceValid(piece))
			throw new Error(`Invalid piece ${ piece }`);

		if (!isLocationValid(location))
			throw new Error(`Invalid location ${ location }`);

		this.configuration.pieces[location.toUpperCase()] = piece;
	}

	public removePiece(location: BoardLocation) {
		if (!isLocationValid(location))
			throw new Error(`Invalid location ${ location }`);


		delete this.configuration.pieces[location.toUpperCase()];
	}

	public isEmpty(location: BoardLocation) {
		if (!isLocationValid(location))
			throw new Error(`Invalid location ${ location }`);


		return !this.configuration.pieces[location.toUpperCase()];
	}

	public getEnemyColor(playerColor: PieceColor) {
		return playerColor === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
	}

	public getPlayingColor() {
		return this.configuration.turn;
	}

	public getNonPlayingColor() {
		return this.isPlayingWhite() ? COLORS.BLACK : COLORS.WHITE;
	}

	public isPlayingWhite() {
		return this.configuration.turn === COLORS.WHITE;
	}

	public isPlayingBlack() {
		return this.configuration.turn === COLORS.BLACK;
	}

	public addMoveToHistory(from: BoardLocation, to: BoardLocation) {
		this.history.push({ from, to, configuration: structuredClone(this.configuration) });
	}

	public move(from: BoardLocation, to: BoardLocation): void {
		// Move logic
		const chessmanFrom = this.getPiece(from);
		const chessmanTo = this.getPiece(to);

		if (!chessmanFrom)
			throw new Error(`There is no piece at ${ from }`);


		Object.assign(this.configuration.pieces, { [to]: chessmanFrom });
		delete this.configuration.pieces[from];

		// pawn reaches an end of a chessboard
		if (this.isPlayingWhite() && this.isPawn(chessmanFrom) && to[1] === '8')
			Object.assign(this.configuration.pieces, { [to]: 'Q' });

		if (this.isPlayingBlack() && this.isPawn(chessmanFrom) && to[1] === '1')
			Object.assign(this.configuration.pieces, { [to]: 'q' });

		// En passant check
		if (this.isPawn(chessmanFrom) && to === this.configuration.enPassant) {
			const p = downByColor(to, this.getPlayingColor()!)!;
			delete this.configuration.pieces[p];
		}

		// pawn En passant special move history
		if (this.isPawn(chessmanFrom) && this.isPlayingWhite() && from[1] === '2' && to[1] === '4')
			this.configuration.enPassant = `${ from[0] }3`;
		else if (this.isPawn(chessmanFrom) && this.isPlayingBlack() && from[1] === '7' && to[1] === '5')
			this.configuration.enPassant = `${ from[0] }6`;
		else
			this.configuration.enPassant = null;

		// Castling - disabling
		if (from === 'E1')
			Object.assign(this.configuration.castling!, { whiteLong: false, whiteShort: false });

		if (from === 'E8')
			Object.assign(this.configuration.castling!, { blackLong: false, blackShort: false });

		if (from === 'A1')
			Object.assign(this.configuration.castling!, { whiteLong: false });

		if (from === 'H1')
			Object.assign(this.configuration.castling!, { whiteShort: false });

		if (from === 'A8')
			Object.assign(this.configuration.castling!, { blackLong: false });

		if (from === 'H8')
			Object.assign(this.configuration.castling!, { blackShort: false });

		// Castling - rook is moving too
		if (this.isKing(chessmanFrom)) {
			if (from === 'E1' && to === 'C1')
				return this.move('A1', 'D1');
			if (from === 'E8' && to === 'C8')
				return this.move('A8', 'D8');
			if (from === 'E1' && to === 'G1')
				return this.move('H1', 'F1');
			if (from === 'E8' && to === 'G8')
				return this.move('H8', 'F8');
		}

		this.configuration.turn = this.isPlayingWhite() ? COLORS.BLACK : COLORS.WHITE;

		if (this.isPlayingWhite())
			this.configuration.fullMove!++;


		this.configuration.halfMove!++;
		if (chessmanTo || this.isPawn(chessmanFrom))
			this.configuration.halfMove = 0;
	}

	public exportJson(): BoardConfiguration {
		return {
			moves:      this.getMoves(),
			pieces:     this.configuration.pieces,
			turn:       this.configuration.turn,
			isFinished: this.configuration.isFinished,
			check:      this.hasPlayingPlayerCheck(),
			checkMate:  this.configuration.checkMate,
			castling:   this.configuration.castling,
			enPassant:  this.configuration.enPassant,
			halfMove:   this.configuration.halfMove,
			fullMove:   this.configuration.fullMove,
		};
	}

	public calculateAiMove(level: AILevel) {
		const scores = this.calculateAiMoves(level);

		return scores[0]!;
	}

	public calculateAiMoves(level: AILevel) {
		if (!AI_LEVELS.includes(level))
			throw new Error(`Invalid level ${ level }. You can choose ${ AI_LEVELS.join(',') }`);

		if (this.shouldIncreaseLevel())
			level++;

		const scoreTable: {from: BoardLocation; to: BoardLocation; score: number;}[] = [];
		const initialScore = this.calculateScore(this.getPlayingColor());
		const moves = this.getMoves();
		for (const from in moves) {
			const possibleMoves = moves[from];

			possibleMoves?.map(to => {
				const testBoard = this.getTestBoard();
				const wasScoreChanged = Boolean(testBoard.getPiece(to));
				testBoard.move(from, to);

				const score = {
					from,
					to,
					score: testBoard.testMoveScores(
						this.getPlayingColor()!,
						level,
						wasScoreChanged,
						wasScoreChanged ? testBoard.calculateScore(this.getPlayingColor()) : initialScore,
						to,
					).score + testBoard.calculateScoreByPiecesLocation(this.getPlayingColor()) +
					(Math.floor(Math.random() * (this.configuration.halfMove! > 10 ? this.configuration.halfMove! - 10 : 1) * 10) / 10),
				};

				scoreTable.push(score);
			});
		}

		scoreTable.sort((previous, next) => {
			return previous.score < next.score ? 1 : previous.score > next.score ? -1 : 0;
		});

		return scoreTable;
	}

	public shouldIncreaseLevel() {
		return this.getIngamePiecesValue() < 50;
	}

	public getIngamePiecesValue() {
		let scoreIndex = 0;
		for (const location in this.configuration.pieces) {
			const piece = this.getPiece(location);
			invariant(piece, `no piece in requested location: ${ location }`);

			scoreIndex += getPieceValue(piece);
		}

		return scoreIndex;
	}

	public getTestBoard() {
		return new Board(structuredClone(this.configuration));
	}

	public testMoveScores(
		playingPlayerColor: PieceColor,
		level: AILevel,
		capture: boolean,
		initialScore: number,
		move: BoardLocation,
		depth = 1,
	) {
		let nextMoves = null;
		if (depth < AI_DEPTH_BY_LEVEL.EXTENDED![level]! && this.hasPlayingPlayerCheck())
			nextMoves = this.getMoves(this.getPlayingColor());
		else if (depth < AI_DEPTH_BY_LEVEL.BASE[level] || (capture && depth < AI_DEPTH_BY_LEVEL.EXTENDED[level]))
			nextMoves = this.getMoves(this.getPlayingColor(), 5);

		if (this.configuration.isFinished) {
			return {
				score: this.calculateScore(playingPlayerColor) + (this.getPlayingColor() === playingPlayerColor ? depth : -depth),
				max:   true,
			};
		}

		if (!nextMoves) {
			if (initialScore !== null)
				return { score: initialScore, max: false };

			const score = this.calculateScore(playingPlayerColor);

			return {
				score,
				max: false,
			};
		}

		let bestScore = this.getPlayingColor() === playingPlayerColor ? SCORE.MIN : SCORE.MAX;
		let maxValueReached = false;
		for (const from in nextMoves) {
			if (maxValueReached)
				continue;

			nextMoves[from]?.forEach(to => {
				if (maxValueReached)
					return;

				const testBoard = this.getTestBoard();
				const wasScoreChanged = Boolean(testBoard.getPiece(to));
				testBoard.move(from, to);
				if (testBoard.hasNonPlayingPlayerCheck())
					return;

				const result = testBoard.testMoveScores(
					playingPlayerColor,
					level,
					wasScoreChanged,
					wasScoreChanged ? testBoard.calculateScore(playingPlayerColor) : initialScore,
					to,
					depth + 1,
				);

				if (result.max)
					maxValueReached = true;

				if (this.getPlayingColor() === playingPlayerColor)
					bestScore = Math.max(bestScore, result.score);
				else
					bestScore = Math.min(bestScore, result.score);
			});
		}

		return { score: bestScore, max: false };
	}

	public calculateScoreByPiecesLocation(player = this.getPlayingColor()) {
		const columnMapping: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4, F: 5, G: 6, H: 7 };
		const scoreMultiplier = 0.5;
		let score = 0;
		for (const location in this.configuration.pieces) {
			const piece = this.getPiece(location);
			invariant(piece, `no piece in requested location: ${ location }`);

			const pieceScores = scoreByPosition[piece]!;
			const scoreRow = parseInt(location[1]!) - 1;
			const scoreColumn = columnMapping[location[0]!]!;

			const scoreIndex = pieceScores[scoreRow]![scoreColumn]!;
			score += (this.getPieceColor(piece) === player ? scoreIndex : -scoreIndex) * scoreMultiplier;
		}

		return score;
	}

	public calculateScore(playerColor = this.getPlayingColor()) {
		let scoreIndex = 0;

		if (this.configuration.checkMate) {
			if (this.getPlayingColor() === playerColor)
				return SCORE.MIN;
			else
				return SCORE.MAX;
		}

		if (this.configuration.isFinished) {
			if (this.getPlayingColor() === playerColor)
				return SCORE.MAX;
			else
				return SCORE.MIN;
		}

		for (const location in this.configuration.pieces) {
			const piece = this.getPiece(location);
			invariant(piece, `no piece in requested location: ${ location }`);

			if (this.getPieceColor(piece) === playerColor)
				scoreIndex += getPieceValue(piece) * PIECE_VALUE_MULTIPLIER;
			else
				scoreIndex -= getPieceValue(piece) * PIECE_VALUE_MULTIPLIER;
		}

		return scoreIndex;
	}

}
