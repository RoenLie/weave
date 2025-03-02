import { Canvas2DObject } from '../canvas/canvas-object.ts';
import type { Vec2 } from '@roenlie/core/types';
import { dataNodes, type NodeData } from './node-catalog.ts';
import type { GraphConnection } from './graph-connection.ts';


export interface StorableGraphNode {
	id:         string;
	created_at: string;
	updated_at: string;
	version:    string;
	x:          number;
	y:          number;
	data?:      string;
}

export class GraphNode implements Vec2 {

	public static sizes: Record<NodeData['type'], number> = {
		minor:    24,
		notable:  36,
		keystone: 56,
	};

	public static isGraphNode(obj: any): obj is GraphNode {
		return obj instanceof GraphNode;
	}

	public static toStorable(node: GraphNode): StorableGraphNode {
		return {
			id:         node.id,
			created_at: node.created,
			updated_at: node.updated,
			version:    node.version,
			x:          node.x,
			y:          node.y,
			data:       node.data?.id,
		};
	}

	public static fromVec2(vec: Vec2): GraphNode {
		const node = new GraphNode();
		node.x     = vec.x;
		node.y     = vec.y;

		return node;
	}

	public static fromStorable(storable: StorableGraphNode) {
		const { x, y, id, updated_at, version } = storable;

		const node   = new GraphNode();
		node.id      = id;
		node.updated = updated_at;
		node.version = version;
		node.x       = x;
		node.y       = y;
		node.data    = dataNodes.get(storable.data ?? '');

		return node;
	}

	public static mapConnections(nodes: Map<string, GraphNode>, connections: Map<string, GraphConnection>) {
		type NodeId = string;
		const startMap: Map<NodeId, GraphConnection[]> = new Map();
		const stopMap: Map<NodeId, GraphConnection[]>  = new Map();

		for (const connection of connections.values()) {
			const startNodes = startMap.get(connection.start.id)
				?? startMap.set(connection.start.id, []).get(connection.start.id)!;
			const stopNodes = stopMap.get(connection.stop.id)
				?? stopMap.set(connection.stop.id, []).get(connection.stop.id)!;

			startNodes.push(connection);
			stopNodes.push(connection);
		}

		for (const node of nodes.values()) {
			node.connections.clear();

			for (const con of startMap.get(node.id) ?? [])
				node.connections.add(con);
			for (const con of stopMap.get(node.id) ?? [])
				node.connections.add(con);
		}
	}

	public id:          string = crypto.randomUUID();
	public created:     string = new Date().toISOString();
	public updated:     string = new Date().toISOString();
	public version:     string;
	public x:           number;
	public y:           number;
	public path:        Canvas2DObject = new Canvas2DObject();
	public connections: Set<GraphConnection> = new Set();
	public data?:       NodeData;

	public get radius() {
		return GraphNode.sizes[this.data?.type ?? 'minor'];
	}

}
