import { maybe, resolvablePromise, type ResolvablePromise } from '@roenlie/core/async';
import { GraphConnection, GraphNode, type StorableGraphConnection, type StorableGraphNode } from '../../app/graph/graph.ts';
import { getGraphConnectionsQry, getGraphNodes, graphConnectionCollection, graphNodeCollection, type ConnectionChunk, type NodeChunk } from './firebase-queries.ts';
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../app/firebase.ts';
import type { Vec2 } from '@roenlie/core/types';
import { Canvas2DObject } from './canvas-object.ts';
import type { NodeData } from '../../app/graph/node-catalog.ts';


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
interface GraphChunkChangeLog {
	update: Set<string>;
	add:    Set<string>;
	delete: Set<string>;
}


export class GraphDataManager {

	constructor(
		protected repository: GraphRepository,
		protected path2DCreator?: GraphPath2DCreator,
	) {}

	public ready:    boolean = false;
	public loading:  ResolvablePromise<void> = resolvablePromise.resolve(void 0);
	public updated?: number = Infinity;

	public nodes:       Map<string, GraphNode>;
	public connections: Map<string, GraphConnection>;

	protected nodeChunks:       NodeChunk[] = [];
	protected connectionChunks: ConnectionChunk[] = [];
	protected loadedVersion:    string = '0.1';
	protected chunkSize = 500;

	public async load() {
		if (!this.loading.done)
			return;

		this.ready = false;
		this.loading = resolvablePromise();

		const { nodeChunks, connectionChunks } = await this.repository.load(this.loadedVersion);

		this.nodeChunks = nodeChunks;
		this.connectionChunks = connectionChunks;

		const nodes = nodeChunks.flatMap(chunk => chunk.nodes);
		const connections = connectionChunks.flatMap(chunk => chunk.connections);

		this.processLoadedData(nodes, connections);

		this.updated = Date.now();
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

	protected applyNodeChanges(changes: GraphChangeset): GraphChunkChangeLog {
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
			chunk.updated = new Date().toISOString();

			chunksToUpdate.add(chunkId);
		}

		// Add new nodes, creating new chunks if necessary.
		for (const nodeId of changes.addedNodes) {
			const node = this.nodes.get(nodeId);
			if (!node)
				continue;

			const chunk = this.nodeChunks.find(chunk => chunk.nodes.length < this.chunkSize);
			if (!chunk) {
				const newChunk = {
					id:      crypto.randomUUID(),
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
				chunk.updated = new Date().toISOString();

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
			chunk.updated = new Date().toISOString();

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

	protected applyConnectionChanges(changes: GraphChangeset): GraphChunkChangeLog {
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
			chunk.updated = new Date().toISOString();

			chunksToUpdate.add(chunkId);
		}

		// Add new connections, creating new chunks if necessary.
		for (const conId of changes.addedConnections) {
			const con = this.connections.get(conId);
			if (!con)
				continue;

			const chunk = this.connectionChunks
				.find(chunk => chunk.connections.length < this.chunkSize);

			if (!chunk) {
				const newChunk = {
					id:          crypto.randomUUID(),
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
				chunk.updated = new Date().toISOString();

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
			chunk.updated = new Date().toISOString();

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

		const changes = this.findChanges();
		const nodeChunkChanges = this.applyNodeChanges(changes);
		const conChunkChanges = this.applyConnectionChanges(changes);

		//console.log({
		//	changes,
		//	nodeChunks:       this.nodeChunks,
		//	connectionChunks: this.connectionChunks,
		//	nodeChunkChanges,
		//	conChunkChanges,
		//});

		await this.repository.save(
			this.loadedVersion,
			this.nodeChunks,
			this.connectionChunks,
			nodeChunkChanges,
			conChunkChanges,
		);

		this.updated = Date.now();
		this.ready = true;
		this.loading.resolve();
	}

	protected async addNodesFromScratch() {
		console.log('Save');

		// Create node chunks.
		const nodeChunks: NodeChunk[] = [];
		for (let i = 0; i < this.nodes.size; i += this.chunkSize) {
			nodeChunks.push({
				id:      crypto.randomUUID(),
				version: '0.1',
				updated: new Date().toISOString(),
				created: new Date().toISOString(),
				nodes:   this.nodes.values()
					.drop(i)
					.take(this.chunkSize)
					.map(node => node.toStorable())
					.toArray(),
			});
		}

		console.log(nodeChunks);
		const nodeResult = await Promise.all(nodeChunks.map(chunk => setDoc(
			doc(db, graphNodeCollection, chunk.id), chunk,
		)));
		console.log(nodeResult);

		// Create connection chunks.
		const connectionChunks: ConnectionChunk[] = [];
		for (let i = 0; i < this.connections.size; i += this.chunkSize) {
			connectionChunks.push({
				id:          crypto.randomUUID(),
				version:     '0.1',
				updated:     new Date().toISOString(),
				created:     new Date().toISOString(),
				connections: this.connections.values()
					.drop(i)
					.take(this.chunkSize)
					.map(node => node.toStorable())
					.toArray(),
			});
		}
		console.log(connectionChunks);
		const conResult = await Promise.all(connectionChunks.map(chunk => setDoc(
			doc(db, graphConnectionCollection, chunk.id), chunk,
		)));
		console.log(conResult);
	}

	public addNode(vec: Vec2) {
		const node = new GraphNode(vec);

		this.nodes.set(node.id, node);

		this.updated = undefined;

		return node;
	}

	public connectNodes(nodeA?: GraphNode, nodeB?: GraphNode) {
		if (!nodeA || !nodeB)
			return false;

		const nodeHasNode = (a: GraphNode, b: GraphNode) =>
			a.connections.values().some(con => con.start.id === b.id || con.stop.id === b.id) ||
			b.connections.values().some(con => con.start.id === a.id || con.stop.id === a.id);

		if (nodeHasNode(nodeA, nodeB))
			return false;

		const connection = new GraphConnection(this.nodes, { start: nodeA.id, stop: nodeB.id });
		this.connections.set(connection.id, connection);

		nodeA.connections.add(connection);
		nodeB.connections.add(connection);

		nodeA.updated = new Date().toISOString();
		nodeB.updated = new Date().toISOString();

		this.updated = undefined;

		return true;
	}

	public deleteNode(node: GraphNode) {
		node.connections.forEach(con => {
			this.connections.delete(con.id);
			con.start.connections.delete(con);
			con.stop.connections.delete(con);
		});

		this.nodes.delete(node.id);

		this.updated = undefined;

		return true;
	}

	public resizeNode(node: GraphNode, radius: number) {
		if (node.radius === radius)
			return false;

		node.radius = radius;
		node.updated = new Date().toISOString();

		node.path = this.path2DCreator?.createNodePath2D(node);

		this.updated = undefined;

		return true;
	}

	public moveNode(node: GraphNode, vec: Vec2) {
		if (node.x === vec.x && node.y === vec.y)
			return false;

		node.x = vec.x;
		node.y = vec.y;
		node.updated = new Date().toISOString();

		const { path2DCreator } = this;
		node.path = path2DCreator?.createNodePath2D(node);

		for (const con of node.connections) {
			con.path = path2DCreator?.createConnectionPath2D?.(this.nodes, con);
			con.pathHandle1 = path2DCreator?.createConnectionHandlePath2D?.(con, 1);
			con.pathHandle2 = path2DCreator?.createConnectionHandlePath2D?.(con, 2);
		}

		this.updated = undefined;

		return true;
	}

	public moveConnection(con: GraphConnection, controlNode: Vec2, vec: Vec2) {
		const conVec = con.m1 === controlNode ? con.m1
			: con.m2 === controlNode ? con.m2
				: undefined;

		if (!conVec)
			return false;

		conVec.x = vec.x;
		conVec.y = vec.y;
		con.updated = new Date().toISOString();

		con.path = this.path2DCreator?.createConnectionPath2D(this.nodes, con);
		con.pathHandle1 = this.path2DCreator?.createConnectionHandlePath2D?.(con, 1);
		con.pathHandle2 = this.path2DCreator?.createConnectionHandlePath2D?.(con, 2);

		this.updated = undefined;

		return true;
	}

	public updateNodeData(node: GraphNode, data: NodeData | undefined) {
		node.data = data;
		node.updated = new Date().toISOString();

		node.path = this.path2DCreator?.createNodePath2D(node);

		this.updated = Date.now();
	}

}


export interface GraphRepository {

	load(version: string): Promise<{
		nodeChunks:       NodeChunk[],
		connectionChunks: ConnectionChunk[];
	}>;

	save(
		version: string,
		nodeChunks: NodeChunk[],
		connectionChunks: ConnectionChunk[],
		nodeChangelog: GraphChunkChangeLog,
		conChangelog: GraphChunkChangeLog,
	): Promise<void>;
}


export class OPFSGraphRepository implements GraphRepository {

	public async load(
		version: string,
	): ReturnType<GraphRepository['load']> {
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(
			'graph-version-' + version + '.json',
			{ create: true },
		);

		const file = await fileHandle.getFile();
		const text = await file.text();

		if (!text) {
			return {
				nodeChunks:       [],
				connectionChunks: [],
			};
		}

		return JSON.parse(await file.text()) as {
			nodeChunks:       NodeChunk[];
			connectionChunks: ConnectionChunk[];
		};
	}

	public async save(
		...args: Parameters<GraphRepository['save']>
	): ReturnType<GraphRepository['save']> {
		const [ version, nodeChunks, connectionChunks ] = args;

		// A FileSystemDirectoryHandle whose type is "directory" and whose name is "".
		const opfsRoot   = await navigator.storage.getDirectory();
		const fileHandle = await opfsRoot.getFileHandle(
			'graph-version-' + version + '.json',
			{ create: true },
		);

		const writable = await fileHandle.createWritable({ keepExistingData: false });

		await writable.write(JSON.stringify({
			version,
			nodeChunks,
			connectionChunks,
		}));
		await writable.close();

		console.log('Saved to OPFS');
	}

}


export class LocalGraphRepository implements GraphRepository {

	public async load(version: string) {
		interface GraphData {
			nodeChunks:       NodeChunk[];
			connectionChunks: ConnectionChunk[];
		}

		const [ data, err ] = await maybe<GraphData>(
			import(`../../assets/graphs/graph-version-${ version }.json?inline`)
				.then(res => res.default as any),
		);

		if (err) {
			console.error(err);

			return {
				nodeChunks:       [],
				connectionChunks: [],
			} satisfies GraphData;
		}
		else {
			console.log('Loaded from local filesystem');
		}

		return {
			nodeChunks:       data.nodeChunks,
			connectionChunks: data.connectionChunks,
		};
	}

	public async save(
		...args: Parameters<GraphRepository['save']>
	): ReturnType<GraphRepository['save']> {
		const [ version, nodeChunks, connectionChunks ] = args;

		const [ , err ] = await maybe(fetch('/save-graph-to-file', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({
				version,
				nodeChunks,
				connectionChunks,
			}),
		}).then(res => res.status));

		if (err)
			console.error(err);
		else
			console.log('Saved to local filesystem');
	}

}


export class FirebaseGraphRepository implements GraphRepository {

	public async load(version: string): Promise<{
		nodeChunks:       NodeChunk[];
		connectionChunks: ConnectionChunk[];
	}> {
		const [ nodeChunks, connectionChunks ] = await Promise.all([
			getGraphNodes(version),
			getGraphConnectionsQry(version),
		]);

		return { nodeChunks, connectionChunks };
	}

	public async save(
		...args: Parameters<GraphRepository['save']>
	): ReturnType<GraphRepository['save']> {
		const [ , nodeChunks, connectionChunks, nodeChangelog, conChangelog ] = args;

		// In the firebase implementation, we actually care about the changelog.
		// We can use this to only update/add/delete on the chunks that have changed.

		const operations: Promise<any>[] = [];

		// Delete node chunks.
		for (const id of nodeChangelog.delete) {
			const op = deleteDoc(doc(db, graphNodeCollection, id));
			operations.push(op);
		}

		// Add node chunks.
		for (const id of nodeChangelog.add) {
			const chunk = nodeChunks.find(c => c.id === id)!;
			const op = addDoc(collection(db, graphNodeCollection, id), chunk);
			operations.push(op);
		}

		// Update node chunks.
		for (const id of nodeChangelog.update) {
			const chunk = { ...nodeChunks.find(c => c.id === id)! };
			const op = updateDoc(doc(db, graphNodeCollection, id), chunk);
			operations.push(op);
		}

		// Delete connection chunks.
		for (const id of conChangelog.delete) {
			const op = deleteDoc(doc(db, graphConnectionCollection, id));
			operations.push(op);
		}

		// Add connection chunks.
		for (const id of conChangelog.add) {
			const chunk = connectionChunks.find(c => c.id === id)!;
			const op = addDoc(collection(db, graphConnectionCollection, id), chunk);
			operations.push(op);
		}

		// Update connection chunks.
		for (const id of conChangelog.update) {
			const chunk = { ...connectionChunks.find(c => c.id === id)! };
			const op = updateDoc(doc(db, graphConnectionCollection, id), chunk);
			operations.push(op);
		}

		const result = await Promise.allSettled(operations);
		console.log(result);

		console.log('Saved to Firebase');
	}

}


export class GraphPath2DCreator implements GraphPath2DCreator {

	constructor(
		public createNodePath2D: (node: GraphNode) => Canvas2DObject,
		public createConnectionPath2D: (nodes: Map<string, GraphNode>, con: GraphConnection) => Canvas2DObject,
		public createConnectionHandlePath2D?: (con: GraphConnection, handle: 1 | 2) => Canvas2DObject,
	) {}

}
