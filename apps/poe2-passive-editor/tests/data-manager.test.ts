import { expect, test } from 'vitest';
import { GraphDataManager, type GraphRepository } from '../src/pages/canvas-editor/data-manager.ts';


class TestGraphRepository implements GraphRepository {

	public async load(): ReturnType<GraphRepository['load']> {
		return {
			nodeChunks:       [],
			connectionChunks: [],
		};
	}

	public async save(
		//...args: Parameters<GraphRepository['save']>
	): ReturnType<GraphRepository['save']> {
		//const [ version, nodeChunks, connectionChunks ] = args;
	}

}


test('data-manager', async () => {
	const manager = new GraphDataManager(new TestGraphRepository());
	await manager.load();

	expect(manager.nodes).to.be.of.length(0);
});
