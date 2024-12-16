export type stringliteral = (string & Record<never, never>);
export type BoardLocation = `${ 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' }${ 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 }` | stringliteral;
export type PieceName = 'rook' | 'knight' | 'bishop' | 'king' | 'queen' | 'pawn';
export type PieceColor = 'white' | 'black' | stringliteral;
export interface PieceInfo { name: PieceName; color: PieceColor; }
export type GamestatePiece = [location: BoardLocation, piece: PieceInfo];
export type Gamestate = GamestatePiece[];
