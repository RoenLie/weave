import { beforeEach, describe, expect, it } from 'vitest';

import { NEW_GAME_BOARD_CONFIG } from '../constants/board.constant.js';
import { Game } from '../Game.js';
import { BoardConfiguration } from '../types.js';


declare module 'vitest' {
	export interface TestContext {
		newGameJson: BoardConfiguration;
	}
}


global.structuredClone = (val: object) => JSON.parse(JSON.stringify(val));


describe('Should properly export FEN', () => {
	it('For new board', () => {
		const expectedFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		const game = new Game();
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
	it('For new board after E2 to E4', () => {
		const expectedFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
		const game = new Game();
		game.move('E2', 'E4');
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
	it('For new board after E2 to E4 and C7 to C5', () => {
		const expectedFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2';
		const game = new Game();
		game.move('E2', 'E4');
		game.move('C7', 'C5');
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
	it('For new board after E2 to E4 and C7 to C5 and E1 to E2', () => {
		const expectedFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2';
		const game = new Game();
		game.move('E2', 'E4');
		game.move('C7', 'C5');
		game.move('E1', 'E2');
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
	it('For new board after E2 to E4 and C7 to C5 and E1 to E2 and D7 do D6', () => {
		const expectedFen = 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/8/PPPPKPPP/RNBQ1BNR w kq - 0 3';
		const game = new Game();
		game.move('E2', 'E4');
		game.move('C7', 'C5');
		game.move('E1', 'E2');
		game.move('D7', 'D6');
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
	it('For new board after E2 to E4 and C7 to C5 and E1 to E2 and D7 do D6 nad G1 to F3', () => {
		const expectedFen = 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R b kq - 1 3';
		const game = new Game();
		game.move('E2', 'E4');
		game.move('C7', 'C5');
		game.move('E1', 'E2');
		game.move('D7', 'D6');
		game.move('G1', 'F3');
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
	it('For new board after E2 to E4 and C7 to C5 and E1 to E2 and D7 do D6 nad G1 to F3 and E8 to D7', () => {
		const expectedFen = 'rnbq1bnr/pp1kpppp/3p4/2p5/4P3/5N2/PPPPKPPP/RNBQ1B1R w - - 2 4';
		const game = new Game();
		game.move('E2', 'E4');
		game.move('C7', 'C5');
		game.move('E1', 'E2');
		game.move('D7', 'D6');
		game.move('G1', 'F3');
		game.move('E8', 'D7');
		expect(game.exportFEN()).to.be.deep.equal(expectedFen);
	});
});

describe('Should properly import FEN', () => {
	beforeEach((ctx) => {
		ctx.newGameJson = structuredClone(NEW_GAME_BOARD_CONFIG);
	});

	it('For new board', (ctx) => {
		const gameFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
		const game = new Game(gameFen);
		const expectedConfiguration = ctx.newGameJson;

		expect(game.board.configuration).to.be.deep.equal(expectedConfiguration);
	});

	it('For new board after E2 to E4', (ctx) => {
		const gameFen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1';
		const game = new Game(gameFen);
		const expectedConfiguration = ctx.newGameJson;
		expectedConfiguration.turn = 'black';
		expectedConfiguration.pieces.E4 = 'P';
		delete expectedConfiguration.pieces.E2;
		expectedConfiguration.enPassant = 'E3';

		expect(game.board.configuration).to.be.deep.equal(expectedConfiguration);
	});

	it('For new board after E2 to E4 and C7 to C5 and E1 to E2', (ctx) => {
		const gameFen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPPKPPP/RNBQ1BNR b kq - 1 2';
		const game = new Game(gameFen);
		const expectedConfiguration = ctx.newGameJson;
		expectedConfiguration.turn = 'black';
		expectedConfiguration.pieces.E4 = 'P';
		expectedConfiguration.pieces.C5 = 'p';
		expectedConfiguration.pieces.E2 = 'K';
		delete expectedConfiguration.pieces.C7;
		delete expectedConfiguration.pieces.E1;
		expectedConfiguration.halfMove = 1;
		expectedConfiguration.fullMove = 2;
		expectedConfiguration.castling!.whiteLong = false;
		expectedConfiguration.castling!.whiteShort = false;

		expect(game.board.configuration).to.be.deep.equal(expectedConfiguration);
	});
});
