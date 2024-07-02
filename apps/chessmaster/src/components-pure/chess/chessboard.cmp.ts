import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { map } from 'lit/directives/map.js';
import { styleMap } from 'lit/directives/style-map.js';

import { Game } from '../../features/chess-engine/Game.js';
import { tileGridLocation } from './chess.constants.js';
import { type BoardLocation } from './chess.types.js';
import { createTileInfo, isUpper, parity } from './chess.utils.js';
import { chessboardStyle } from './chessboard.styles.js';


@customElement('mi-chessboard')
export class MiChessboardCmp extends LitElement {

	//#region properties
	protected backgroundTiles = Array(8 * 8).fill(null).map((key, i) => {
		let { row, gridRow, gridColumn, letter } = createTileInfo(i);

		let modifier = parity(row) === 'even' ? 0 : 1;
		let oddoreven = parity(i + modifier);
		let color = oddoreven === 'even' ? 'white' : 'black';

		return { color, gridRow, gridColumn, location: letter + row };
	});

	@state() protected availableMoves: BoardLocation[] = [];
	@state() protected selectedLocation?: BoardLocation;
	protected chess = new Game();
	//#endregion


	//#region controllers
	//#endregion


	//#region lifecycle
	public override connectedCallback() {
		super.connectedCallback();
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();
	}
	//#endregion


	//#region logic
	protected handleBoardClick(ev: Event) {
		const target = ev.target as HTMLElement;
		const location = target.dataset['location'];

		if (!location)
			throw ('could not get board location');

		if (!this.selectedLocation)
			return;

		const move = this.chess.move(this.selectedLocation, location);
		this.availableMoves = [];
		this.selectedLocation = undefined;

		this.chess.aiMove(1);
	}

	protected handlePieceClick(ev: Event) {
		ev.stopPropagation();

		const target = ev.target as HTMLElement;
		const location = target.dataset['location'];

		if (!location)
			throw ('could not get board location');

		if (location === this.selectedLocation) {
			this.availableMoves = [];
			this.selectedLocation = undefined;
		}
		else if (this.availableMoves.includes(location)) {
			this.handleBoardClick(ev);
		}
		else {
			this.availableMoves = this.chess.moves(location);
			this.selectedLocation = location;
		}
	}
	//#endregion


	//#region template
	protected override render() {
		return html`
		<div class="base" @click=${ this.handleBoardClick }>
			<!-- background tiles -->
			${ map(this.backgroundTiles, ({ color, gridColumn, location, gridRow }) => {
				let tileClasses = { chessboard__tile: true, [color]: true };
				let tileStyles  = { gridRow, gridColumn };

				return html`
				<div
					data-location=${ location }
					class=${ classMap(tileClasses) }
					style=${ styleMap(tileStyles) }
				></div>
				`;
			}) }

			<!-- game pieces -->
			${ map(Object.entries(this.chess?.board?.configuration?.pieces), ([ loc, piece ]) => {
				if (!piece)
					return;

				const nameMap: Record<string, string> = {
					K: 'king',
					Q: 'queen',
					B: 'bishop',
					R: 'rook',
					N: 'knight',
					P: 'pawn',
				};

				let [ gridRow, gridColumn ] = tileGridLocation.get(loc)!;
				let color = isUpper(piece) ? 'white' : 'black';
				let name = nameMap[piece.toUpperCase()];

				return html`
				<div
					data-location=${ loc }
					class=${ classMap({ chessboard__tile: true, chessboard__piece: true }) }
					style=${ styleMap({ gridRow, gridColumn }) }
					@click=${ (e: Event) => this.handlePieceClick(e) }
				>
					<es-icon
						size="xxx-large"
						library="chess"
						name=${ color + '_' + name }
					></es-icon>
				</div>
				`;
			}) }

			<!-- available moves -->
			${ map(this.availableMoves, location => {
				let [ gridRow, gridColumn ] = tileGridLocation.get(location)!;

				return html`
				<div
					data-location=${ location }
					class="chessboard__available-move"
					style=${ styleMap({ gridRow, gridColumn }) }
				>
				<es-icon
					size="xxx-large"
					library="default"
					name="app"
				></es-icon>
				</div>
				`;
			}) }

		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = chessboardStyle;
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-chessboard': MiChessboardCmp;
	}
	interface HTMLElementEventMap {

	}
}
