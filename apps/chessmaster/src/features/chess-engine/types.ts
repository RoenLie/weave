export type stringliteral = (string & Record<never, never>);
export type BoardLocation = `${ 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H' }${ 1|2|3|4|5|6|7|8 }` | stringliteral;
export type PieceName = 'rook'|'knight'|'bishop'|'king'|'queen'|'pawn';
export type PieceColor = 'white'|'black' | stringliteral;
export type AILevel = 0 | 1 | 2 | 3 | 4;
export type Piece = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P' | 'k' | 'q'	| 'r' | 'b' | 'n' | 'p' | stringliteral;
export type PieceLocation = BoardLocation | null;
export interface Castling {
	whiteShort: boolean;
	blackShort: boolean;
	whiteLong: boolean;
	blackLong: boolean;
}
export interface BoardConfiguration {
	pieces: Partial<Record<BoardLocation, Piece>>;
	moves?: Partial<Record<BoardLocation, BoardLocation[]>>;
	castling?: Castling;
	fullMove?: number;
	halfMove?: number;
	enPassant?: BoardLocation | null;
	isFinished?: boolean;
	checkMate?: boolean;
	check?: boolean;
	turn?: PieceColor;
}
