import { maybe, resolvablePromise, type ResolvablePromise } from '@roenlie/core/async';
import { GraphConnection, GraphNode, type StorableGraphConnection, type StorableGraphNode } from '../../app/graph/graph.ts';
import { getGraphConnectionsQry, getGraphNodes, graphConnectionCollection, graphNodeCollection, type ConnectionChunk, type NodeChunk } from './firebase-queries.ts';
import { domId } from '@roenlie/core/dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../app/firebase.ts';


interface NodeChunkRef { chunkId: string; nodeId: string; }
interface ConChunkRef { chunkId: string; conId: string; }
interface GraphChangeset {
	deletedNodes:       NodeChunkRef[];
	deletedConnections: ConChunkRef[];
	addedNodes:         string[];
	addedConnections:   string[];
	updatedNodes:       NodeChunkRef[];
	updatedConnections: ConChunkRef[];
}


export class GraphDataManager {

	public ready = false;
	public loading: ResolvablePromise<void> = resolvablePromise.resolve(void 0);

	public nodes:       Map<string, GraphNode>;
	public connections: Map<string, GraphConnection>;

	protected nodeChunks:       NodeChunk[] = [];
	protected connectionChunks: ConnectionChunk[] = [];
	protected loadedVersion:    string = '0.1';

	protected async loadFromOPFS() {
		return;

		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('passive-graph', { create: true });
		const file       = await fileHandle.getFile();

		return JSON.parse(await file.text()) as {
			nodes:       StorableGraphNode[];
			connections: StorableGraphConnection[];
		};
	}

	protected async loadFromLocalAsset() {
		interface GraphData {
			nodeChunks:       NodeChunk[];
			connectionChunks: ConnectionChunk[];
		}

		const [ data, err ] = await maybe<GraphData>(
			import(`../../assets/graphs/graph-version-${ this.loadedVersion }.json?inline`)
				.then(res => res.default as any),
		);

		if (err)
			throw err;

		const { nodeChunks, connectionChunks } = data;

		this.nodeChunks = nodeChunks;
		this.connectionChunks = connectionChunks;

		const nodes = nodeChunks.flatMap(chunk => chunk.nodes);
		const connections = connectionChunks.flatMap(chunk => chunk.connections);

		return { nodes, connections };
	}

	protected async loadFromFirebase() {
		const [ nodeChunks, connectionChunks ] = await Promise.all([
			getGraphNodes(this.loadedVersion),
			getGraphConnectionsQry(this.loadedVersion),
		]);

		this.nodeChunks = nodeChunks;
		this.connectionChunks = connectionChunks;

		const nodes = nodeChunks.flatMap(chunk => chunk.nodes);
		const connections = connectionChunks.flatMap(chunk => chunk.connections);

		return { nodes, connections };
	}

	public async load() {
		if (!this.loading.done)
			return;

		this.ready = false;
		this.loading = resolvablePromise();

		const { nodeChunks, connectionChunks } = await new LocalGraphRepository(this.loadedVersion).load();

		this.nodeChunks = nodeChunks;
		this.connectionChunks = connectionChunks;
		const nodes = nodeChunks.flatMap(chunk => chunk.nodes);
		const connections = connectionChunks.flatMap(chunk => chunk.connections);

		//const { nodes, connections } = await this.loadFromLocalAsset();
		//const { nodes, connections } = await this.loadFromFirebase();

		this.processLoadedData(nodes, connections);
		//console.log(this.nodes, this.connections);

		this.ready = true;
		this.loading.resolve();
	}

	protected processLoadedData(nodes: StorableGraphNode[], connections: StorableGraphConnection[]) {
		this.nodes = new Map(nodes.map(node => [ node.id, new GraphNode(node) ]));
		this.connections = new Map(connections.map(con => [ con.id, new GraphConnection(this.nodes, con) ]));

		for (const node of this.nodes.values())
			node.mapConnections(this.connections);
	}

	protected findChanges(): GraphChangeset {
		const nodeIdsToChunk = new Map(
			this.nodeChunks.flatMap(
				chunk => chunk.nodes.map(
					n => [ n.id, chunk.id ],
				),
			),
		);

		const conIdsToChunk = new Map(
			this.connectionChunks.flatMap(
				chunk => chunk.connections.map(
					c => [ c.id, chunk.id ],
				),
			),
		);

		const deletedNodes: NodeChunkRef[] = [];
		for (const chunk of this.nodeChunks) {
			for (const node of chunk.nodes) {
				if (!this.nodes.has(node.id))
					deletedNodes.push({ chunkId: chunk.id, nodeId: node.id });
			}
		}

		const deletedConnections: ConChunkRef[] = [];
		for (const chunk of this.connectionChunks) {
			for (const con of chunk.connections) {
				if (!this.connections.has(con.id))
					deletedConnections.push({ chunkId: chunk.id, conId: con.id });
			}
		}

		const addedNodes: string[] = [];
		for (const node of this.nodes.values())
			!nodeIdsToChunk.has(node.id) && addedNodes.push(node.id);

		const addedConnections: string[] = [];
		for (const con of this.connections.values())
			!conIdsToChunk.has(con.id) && addedConnections.push(con.id);

		const updatedNodes: NodeChunkRef[] = [];
		for (const node of this.nodes.values()) {
			const chunkId = nodeIdsToChunk.get(node.id);
			if (!chunkId)
				continue;

			const chunk = this.nodeChunks.find(chunk => chunk.id === chunkId);
			if (!chunk)
				continue;

			const oldNode = chunk.nodes.find(n => n.id === node.id);
			if (!oldNode)
				continue;

			if (oldNode.updated !== node.updated)
				updatedNodes.push({ chunkId: chunk.id, nodeId: node.id });
		}

		const updatedConnections: ConChunkRef[] = [];
		for (const con of this.connections.values()) {
			const chunkId = conIdsToChunk.get(con.id);
			if (!chunkId)
				continue;

			const chunk = this.connectionChunks.find(chunk => chunk.id === chunkId);
			if (!chunk)
				continue;

			const oldCon = chunk.connections.find(c => c.id === con.id);
			if (!oldCon)
				continue;

			if (oldCon.updated !== con.updated)
				updatedConnections.push({ chunkId: chunk.id, conId: con.id });
		}

		return {
			deletedNodes,
			deletedConnections,
			addedNodes,
			addedConnections,
			updatedNodes,
			updatedConnections,
		};
	}

	protected applyNodeChanges(changes: GraphChangeset) {
		const chunksToUpdate: Set<string> = new Set();
		const chunksToAdd:    Set<string> = new Set();
		const chunksToDelete: Set<string> = new Set();

		// Remove deleted nodes.
		for (const { chunkId, nodeId } of changes.deletedNodes) {
			const chunk = this.nodeChunks.find(c => c.id === chunkId);
			if (!chunk)
				continue;

			const nodeIndex = chunk.nodes.findIndex(n => n.id === nodeId);
			if (nodeIndex === -1)
				continue;

			chunk.nodes.splice(nodeIndex, 1);
			chunksToUpdate.add(chunkId);
		}

		// Add new nodes, creating new chunks if necessary.
		for (const nodeId of changes.addedNodes) {
			const node = this.nodes.get(nodeId);
			if (!node)
				continue;

			const chunk = this.nodeChunks.find(chunk => chunk.nodes.length < 500);
			if (!chunk) {
				const newChunk = {
					id:      domId(),
					version: this.loadedVersion,
					index:   this.nodeChunks.length,
					updated: new Date().toISOString(),
					created: new Date().toISOString(),
					nodes:   [ node.toStorable() ],
				};

				this.nodeChunks.push(newChunk);
				chunksToAdd.add(newChunk.id);
			}
			else {
				chunk.nodes.push(node.toStorable());
				chunksToUpdate.add(chunk.id);
			}
		}

		// Update nodes.
		for (const { chunkId, nodeId } of changes.updatedNodes) {
			const chunk = this.nodeChunks.find(c => c.id === chunkId);
			if (!chunk)
				continue;

			const nodeIndex = chunk.nodes.findIndex(n => n.id === nodeId);
			if (nodeIndex === -1)
				continue;

			const node = this.nodes.get(nodeId);
			if (!node)
				continue;

			chunk.nodes[nodeIndex] = node.toStorable();
			chunksToUpdate.add(chunkId);
		}

		// Remove empty node chunks.
		for (let i = this.nodeChunks.length - 1; i >= 0; i--) {
			const chunk = this.nodeChunks[i]!;

			if (chunk.nodes.length === 0) {
				chunksToDelete.add(chunk.id);
				this.nodeChunks.splice(i, 1);
			}
		}

		return {
			update: chunksToUpdate,
			add:    chunksToAdd,
			delete: chunksToDelete,
		};
	}

	protected applyConnectionChanges(changes: GraphChangeset) {
		const chunksToUpdate: Set<string> = new Set();
		const chunksToAdd:    Set<string> = new Set();
		const chunksToDelete: Set<string> = new Set();

		// Remove deleted connections.
		for (const { chunkId, conId } of changes.deletedConnections) {
			const chunk = this.connectionChunks.find(c => c.id === chunkId);
			if (!chunk)
				continue;

			const conIndex = chunk.connections.findIndex(c => c.id === conId);
			if (conIndex === -1)
				continue;

			chunk.connections.splice(conIndex, 1);
			chunksToUpdate.add(chunkId);
		}

		// Add new connections, creating new chunks if necessary.
		for (const conId of changes.addedConnections) {
			const con = this.connections.get(conId);
			if (!con)
				continue;

			const chunk = this.connectionChunks.find(chunk => chunk.connections.length < 500);
			if (!chunk) {
				const newChunk = {
					id:          domId(),
					version:     this.loadedVersion,
					index:       this.connectionChunks.length,
					updated:     new Date().toISOString(),
					created:     new Date().toISOString(),
					connections: [ con.toStorable() ],
				};

				this.connectionChunks.push(newChunk);
				chunksToAdd.add(newChunk.id);
			}
			else {
				chunk.connections.push(con.toStorable());
				chunksToUpdate.add(chunk.id);
			}
		}

		// Update connections.
		for (const { chunkId, conId } of changes.updatedConnections) {
			const chunk = this.connectionChunks.find(c => c.id === chunkId);
			if (!chunk)
				continue;

			const conIndex = chunk.connections.findIndex(c => c.id === conId);
			if (conIndex === -1)
				continue;

			const con = this.connections.get(conId);
			if (!con)
				continue;

			chunk.connections[conIndex] = con.toStorable();
			chunksToUpdate.add(chunkId);
		}

		// Remove empty connection chunks.
		for (let i = this.connectionChunks.length - 1; i >= 0; i--) {
			const chunk = this.connectionChunks[i]!;

			if (chunk.connections.length === 0) {
				chunksToDelete.add(chunk.id);
				this.connectionChunks.splice(i, 1);
			}
		}

		return {
			update: chunksToUpdate,
			add:    chunksToAdd,
			delete: chunksToDelete,
		};
	}

	public async save() {
		if (!this.loading.done)
			return;

		this.ready = false;
		this.loading = resolvablePromise();

		await this.saveToLocalFile();

		this.ready = true;
		this.loading.resolve();
	}

	protected async addNodesFromScratch() {
		console.log('Save');
		//console.log(this.connections, this.nodes);

		const chunkSize = 500;

		// Create node chunks.
		const nodeChunks: NodeChunk[] = [];
		for (let i = 0; i < this.nodes.size; i += chunkSize) {
			nodeChunks.push({
				id:      domId(),
				version: '0.1',
				index:   i / chunkSize,
				updated: new Date().toISOString(),
				created: new Date().toISOString(),
				nodes:   this.nodes.values()
					.drop(i)
					.take(chunkSize)
					.map(node => node.toStorable())
					.toArray(),
			});
		}

		console.log(nodeChunks);
		const nodeResult = await Promise.all(nodeChunks.map(chunk => addDoc(
			collection(db, graphNodeCollection), chunk,
		)));
		console.log(nodeResult);

		// Create connection chunks.
		const connectionChunks: ConnectionChunk[] = [];
		for (let i = 0; i < this.connections.size; i += chunkSize) {
			connectionChunks.push({
				id:          domId(),
				version:     '0.1',
				index:       i / chunkSize,
				updated:     new Date().toISOString(),
				created:     new Date().toISOString(),
				connections: this.connections.values()
					.drop(i)
					.take(chunkSize)
					.map(node => node.toStorable())
					.toArray(),
			});
		}
		console.log(connectionChunks);
		const conResult = await Promise.all(connectionChunks.map(chunk => addDoc(
			collection(db, graphConnectionCollection), chunk,
		)));
		console.log(conResult);
	}

	public async saveToOPFS() {
		const changes = this.findChanges();
		this.applyNodeChanges(changes);
		this.applyConnectionChanges(changes);

		// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle('graph-version-' + this.loadedVersion, { create: true });
		const writable   = await fileHandle.createWritable({ keepExistingData: false });

		await writable.write(JSON.stringify({
			version:          3,
			nodeChunks:       this.nodeChunks,
			connectionChunks: this.connectionChunks,
		}));
		await writable.close();

		console.log('Saved to OPFS');
	}

	public async saveToLocalFile() {
		const changes = this.findChanges();
		this.applyNodeChanges(changes);
		this.applyConnectionChanges(changes);

		const [ , err ] = await maybe(fetch('/save-graph-to-file', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({
				version:          this.loadedVersion,
				nodeChunks:       this.nodeChunks,
				connectionChunks: this.connectionChunks,
			}),
		}).then(res => res.status));

		if (err)
			console.error(err);
		else
			console.log('Saved to local filesystem');
	}

	public async saveToFirebase() {
		const changes = this.findChanges();
		const nodeChunkChanges = this.applyNodeChanges(changes);
		const conChunkChanges = this.applyConnectionChanges(changes);
		console.log(changes, nodeChunkChanges, conChunkChanges);
	}

}


interface GraphRepository {

	load(): Promise<{
		nodeChunks:       NodeChunk[],
		connectionChunks: ConnectionChunk[];
	}>;

	save(): Promise<void>;
}

class LocalGraphRepository implements GraphRepository {

	constructor(version: string) {
		this.loadedVersion = version;
	}

	protected loadedVersion: string = '0.1';

	public async load() {
		interface GraphData {
			nodeChunks:       NodeChunk[];
			connectionChunks: ConnectionChunk[];
		}

		const [ data, err ] = await maybe<GraphData>(
			import(`../../assets/graphs/graph-version-${ this.loadedVersion }.json?inline`)
				.then(res => res.default as any),
		);

		if (err)
			throw err;

		console.log('Load from local');

		return {
			nodeChunks:       data.nodeChunks,
			connectionChunks: data.connectionChunks,
		};
	}

	public async save() {
		console.log('Save to local');
	}

}
