import { ObservableMap } from '../../structures/ObservableMap.js';
import { initialGamestate, tileGridLocation } from './chess.constants.js';
import { BoardLocation, GamestatePiece, PieceInfo } from './chess.types.js';


export class Chess {

	public color: 'white' | 'black' = 'white';
	public tileMap = new ObservableMap<BoardLocation, PieceInfo>();

	constructor() {
		this.reset();
	}

	public gamestate() {
		return [ ...this.tileMap.entries() ].filter(((ent): ent is GamestatePiece => !!ent[1]));
	}

	public move({ from, to }: {from: BoardLocation; to: BoardLocation;}) {
		// Move out the piece being moved.
		let pieceMoved = this.tileMap.get(from)!;
		this.tileMap.delete(from);

		// get any piece from the location being moved to.
		if (this.tileMap.has(to)) {
			let pieceTaken = this.tileMap.get(to);
		}

		// Put piece being moved into new location.
		this.tileMap.set(to, pieceMoved);

		console.log(this.tileMap.history());
	}

	public available(location: BoardLocation) {
		return [ ...tileGridLocation.keys() ].filter(loc => loc !== location);
	}

	public reset() {
		this.tileMap.clear();
		initialGamestate.forEach(([ location, piece ]) => this.tileMap.set(location, piece));
		this.tileMap.clearHistory();
	}

}
