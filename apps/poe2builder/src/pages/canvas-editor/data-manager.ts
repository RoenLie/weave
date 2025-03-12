import { maybe, resolvablePromise, type ResolvablePromise } from '@roenlie/core/async';
import { GraphNode, type StorableGraphNode } from '../../app/graph/graph-node.ts';
import { getGraphConnections, getGraphNodes, graphConnectionCollection, graphNodeCollection, type ConnectionChunk, type NodeChunk } from './firebase-queries.ts';
import { addDoc, collection, deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../app/firebase.ts';
import type { Vec2 } from '@roenlie/core/types';
import type { NodeData } from '../../app/graph/node-catalog.ts';
import { GraphConnection, type StorableGraphConnection } from '../../app/graph/graph-connection.ts';
import { supabase } from '../../app/supabase.ts';
import { range } from '@roenlie/core/array';


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

	constructor(protected repository: GraphRepository2) {}

	public ready:            boolean = false;
	public loading:          ResolvablePromise<void> = resolvablePromise.resolve(void 0);
	public updatedAt?:       number = Infinity;
	public nodes:            Map<string, GraphNode> = new Map();
	public connections:      Map<string, GraphConnection> = new Map();
	public nodeChunks:       NodeChunk[] = [];
	public connectionChunks: ConnectionChunk[] = [];

	protected loadedVersion: string = '0.1';
	protected chunkSize = 500;

	public async load() {
		console.log('Loading graph data');

		if (!this.loading.done)
			return;

		this.ready = false;
		this.loading = resolvablePromise();

		const { nodes, connections } = await this.repository.load(this.loadedVersion);

		this.nodes = new Map(
			nodes.map(node => [ node.id, GraphNode.fromStorable(node) ]),
		);
		this.connections = new Map(
			connections.map(con => [ con.id, GraphConnection.fromStorable(con, this.nodes) ]),
		);

		GraphNode.mapConnections(this.nodes, this.connections);

		this.updatedAt = Date.now();
		this.ready = true;
		this.loading.resolve();
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

			if (oldNode.updated_at !== node.updated)
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

			if (oldCon.updated_at !== con.updated)
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
					nodes:   [ GraphNode.toStorable(node) ],
				};

				this.nodeChunks.push(newChunk);
				chunksToAdd.add(newChunk.id);
			}
			else {
				chunk.nodes.push(GraphNode.toStorable(node));
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

			chunk.nodes[nodeIndex] = GraphNode.toStorable(node);
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
					connections: [ GraphConnection.toStorable(con) ],
				};

				this.connectionChunks.push(newChunk);
				chunksToAdd.add(newChunk.id);
			}
			else {
				chunk.connections.push(GraphConnection.toStorable(con));
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

			chunk.connections[conIndex] = GraphConnection.toStorable(con);
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
			return false;

		this.ready = false;
		this.loading = resolvablePromise();

		//const changes = this.findChanges();
		//const nodeChunkChanges = this.applyNodeChanges(changes);
		//const conChunkChanges = this.applyConnectionChanges(changes);

		await this.repository.save(
			this.loadedVersion,
			this.nodes.values().map(GraphNode.toStorable).toArray(),
			this.connections.values().map(GraphConnection.toStorable).toArray(),
		);

		this.updatedAt = Date.now();
		this.ready = true;
		this.loading.resolve();

		return true;
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
					.map(GraphNode.toStorable)
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
					.map(GraphConnection.toStorable)
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
		const node = GraphNode.fromVec2(vec);

		this.nodes.set(node.id, node);
		this.updatedAt = undefined;

		return node;
	}

	public connectNodes(nodeA?: GraphNode, nodeB?: GraphNode) {
		const nodeHasNode = (a: GraphNode, b: GraphNode) =>
			a.connections.values().some(con => con.start.id === b.id || con.stop.id === b.id) ||
			b.connections.values().some(con => con.start.id === a.id || con.stop.id === a.id);

		if (!nodeA || !nodeB)
			return false;
		if (nodeA === nodeB)
			return false;
		if (nodeHasNode(nodeA, nodeB))
			return false;


		const connection = GraphConnection.fromConnect(nodeA, nodeB);
		this.connections.set(connection.id, connection);

		nodeA.connections.add(connection);
		nodeB.connections.add(connection);

		nodeA.updated = new Date().toISOString();
		nodeB.updated = new Date().toISOString();

		this.updatedAt = undefined;

		return true;
	}

	public deleteNode(node: GraphNode) {
		node.connections.forEach(con => {
			this.connections.delete(con.id);
			con.start.connections.delete(con);
			con.stop.connections.delete(con);
		});

		this.nodes.delete(node.id);

		this.updatedAt = undefined;

		return true;
	}

	public moveNode(node: GraphNode, vec: Vec2) {
		if (node.x === vec.x && node.y === vec.y)
			return false;

		node.x = vec.x;
		node.y = vec.y;
		node.updated = new Date().toISOString();

		this.updatedAt = undefined;

		return true;
	}

	public moveConnection(con: GraphConnection, handle: Vec2, vec: Vec2) {
		if (handle.x === vec.x && handle.y === vec.y)
			return false;

		handle.x = vec.x;
		handle.y = vec.y;
		con.updated = new Date().toISOString();

		this.updatedAt = undefined;

		return true;
	}

	public updateNodeData(node: GraphNode, data: NodeData | undefined) {
		node.data = data;
		node.updated = new Date().toISOString();

		this.updatedAt = undefined;
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


export interface GraphRepository2 {

	load(version: string): Promise<{
		nodes:       StorableGraphNode[],
		connections: StorableGraphConnection[];
	}>;

	save(
		version: string,
		nodes: StorableGraphNode[],
		connections: StorableGraphConnection[],
		//nodeChangelog: GraphChunkChangeLog,
		//conChangelog: GraphChunkChangeLog,
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

		const nodes = nodeChunks
			.flatMap(chunk => chunk.nodes)
			.map(node => {
				const clone: any = { ...node };

				return {
					id:         clone.id,
					created_at: clone.updated_at,
					updated_at: clone.updated_at,
					x:          clone.x,
					y:          clone.y,
				};
			});

		const connections = connectionChunks
			.flatMap(chunk => chunk.connections)
			.map(con => {
				const clone: any = { ...con };

				return {
					id:         clone.id,
					created_at: clone.updated_at,
					updated_at: clone.updated_at,
					start:      clone.start,
					stop:       clone.stop,
					m1:         clone.m1,
					m2:         clone.m2,
				};
			});

		const [ , err ] = await maybe(fetch('/save-graph-to-file', {
			method:  'POST',
			headers: { 'Content-Type': 'application/json' },
			body:    JSON.stringify({
				version,
				nodes,
				connections,
			}),
		}).then(res => res.status));

		if (err)
			console.error(err);
		else
			console.log('Saved to local filesystem');
	}

}


export class SupabaseGraphRepository implements GraphRepository2 {

	public async load(version: string) {
		interface GraphData {
			nodes:       StorableGraphNode[];
			connections: StorableGraphConnection[];
		}

		const getAllNodes = async () => {
			const { count } = await supabase
				.from('graph_nodes')
				.select('*', { count: 'exact', head: true })
				.eq('version', version);

			if (!count)
				return [];

			const limit  = 1000;

			const results = (await Promise.all(range(Math.ceil(count / limit)).map(async i => {
				const { data: nodes, error: nodeError } = await supabase
					.from('graph_nodes')
					.select('*')
					.eq('version', version)
					.range(limit * i, limit * i + limit);

				if (nodeError)
					throw nodeError;

				return nodes;
			}))).flat();

			return results as StorableGraphNode[];
		};
		const nodes = await getAllNodes();


		const getAllConnections = async () => {
			const { count } = await supabase
				.from('graph_connections')
				.select('*', { count: 'exact', head: true })
				.eq('version', version);

			if (!count)
				return [];

			const limit  = 1000;

			const results = (await Promise.all(range(Math.ceil(count / limit)).map(async i => {
				const { data: connections, error: connectionError } = await supabase
					.from('graph_connections')
					.select()
					.eq('version', version)
					.range(limit * i, limit * i + limit);

				if (connectionError)
					throw connectionError;

				return connections;
			}))).flat();

			return results as StorableGraphConnection[];
		};
		const connections = await getAllConnections();

		console.log('Loaded from supabase');

		return {	nodes, connections } satisfies GraphData;
	}

	public async save(
		...args: Parameters<GraphRepository2['save']>
	): ReturnType<GraphRepository2['save']> {
		const [ version, nodes, connections ] = args;

		//const { data: insertData, error: insertErr } = await supabase
		//	.from('graph_nodes')
		//	.insert(nodes)
		//	.select();

		//const { data: insertData, error: insertErr } = await supabase
		//	.from('graph_connections')
		//	.insert(connections)
		//	.select();

		//if (insertErr)
		//	console.error(insertErr);
		//else
		//	console.log('Saved to supabase', insertData);
	}

}


export class FirebaseGraphRepository implements GraphRepository {

	public async load(version: string): Promise<{
		nodeChunks:       NodeChunk[];
		connectionChunks: ConnectionChunk[];
	}> {
		const [ nodeChunks, connectionChunks ] = await Promise.all([
			getGraphNodes(version),
			getGraphConnections(version),
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
		console.log(result.map(res => res.status));
		console.log('Saved to Firebase');
	}

}
