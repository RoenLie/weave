import type { Vec2 } from '@roenlie/core/types';
import { Canvas2DObject } from '../canvas/canvas-object.ts';
import { getPathReduction } from '../canvas/path-helpers.ts';
import type { GraphNode } from './graph-node.ts';


export type GraphConnectionVec2 = Vec2 & {
	index: 1 | 2, connection: GraphConnection;
};


export interface StorableGraphConnection {
	id:         string;
	created_at: string;
	updated_at: string;
	version:    string;
	start:      string;
	stop:       string;
	m1:         Vec2;
	m2:         Vec2;
}


export class GraphConnection {

	public static isGraphConnection(obj: any): obj is GraphConnection {
		return obj instanceof GraphConnection;
	}

	public static fromConnect(start: GraphNode, stop: GraphNode) {
		const connection = new GraphConnection();
		connection.start = start;
		connection.stop  = stop;

		const mid = { x: (start.x + stop.x) / 2, y: (start.y + stop.y) / 2 };
		const m1  = { x: (start.x + mid.x) / 2, y: (start.y + mid.y) / 2 };
		const m2  = { x: (mid.x + stop.x) / 2, y: (mid.y + stop.y) / 2 };

		const startRadius = start.radius / 2;
		const stopRadius  = stop.radius  / 2;
		const [ x1, y1 ] = getPathReduction(startRadius, start, m1);
		const [ x2, y2 ] = getPathReduction(stopRadius, m2, stop);

		m1.x += x1;
		m1.y += y1;
		m2.x -= x2;
		m2.y -= y2;

		connection.m1 = { index: 1, x: m1.x, y: m1.y, connection };
		connection.m2 = { index: 2, x: m2.x, y: m2.y, connection };

		return connection;
	}

	public static fromStorable(
		storable: StorableGraphConnection,
		nodes: Map<string, GraphNode>,
	): GraphConnection {
		const { id, created_at, updated_at, version, start, stop, m1, m2 } = storable;

		const connection   = new GraphConnection();
		connection.id      = id;
		connection.created = created_at;
		connection.updated = updated_at;
		connection.version = version;
		connection.start   = nodes.get(start)!;
		connection.stop    = nodes.get(stop)!;
		connection.m1      = { index: 1, x: m1.x, y: m1.y, connection };
		connection.m2      = { index: 2, x: m2.x, y: m2.y, connection };

		return connection;
	}

	public static toStorable(connection: GraphConnection): StorableGraphConnection {
		return {
			id:         connection.id,
			created_at: connection.created,
			updated_at: connection.updated,
			version:    connection.version,
			start:      connection.start.id,
			stop:       connection.stop.id,
			m1:         { x: connection.m1.x, y: connection.m1.y },
			m2:         { x: connection.m2.x, y: connection.m2.y },
		};
	}

	public id:      string = crypto.randomUUID();
	public created: string = new Date().toISOString();
	public updated: string = new Date().toISOString();
	public version: string;
	public start:   GraphNode;
	public stop:    GraphNode;
	public m1:      GraphConnectionVec2;
	public m2:      GraphConnectionVec2;

	public path:        Canvas2DObject = new Canvas2DObject();
	public pathHandle1: Canvas2DObject = new Canvas2DObject();
	public pathHandle2: Canvas2DObject = new Canvas2DObject();

}
