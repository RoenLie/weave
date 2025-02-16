import type { Canvas2DObject } from '../../pages/canvas-editor/canvas-object.ts';
import type { Vec2 } from '@roenlie/core/types';
import { getPathReduction } from '../canvas/path-helpers.ts';
import { allDataNodes, type NodeData } from './node-catalog.ts';


export type StringVec2 = `x${ number }y${ number }`;
export interface StorableGraphConnection {
	id:      string;
	updated: string;
	start:   string;
	stop:    string;
	m1:      Vec2;
	m2:      Vec2;
}
export interface StorableGraphNode {
	id:          string;
	updated:     string;
	x:           number;
	y:           number;
	radius:      number;
	connections: string[];
	data:        string;
}


export class GraphConnection {

	constructor(
		nodes: Map<string, GraphNode>,
		storable: Partial<StorableGraphConnection>
				& Pick<StorableGraphConnection, 'start' | 'stop'>,
	) {
		let { start, stop, m1, m2, id, updated } = storable;

		this.id = id || crypto.randomUUID();
		this.updated = updated || new Date().toISOString();

		const startNode = nodes.get(start)!;
		const stopNode  = nodes.get(stop)!;

		this.start = startNode;
		this.stop  = stopNode;

		if (!m1 || !m2) {
			const mid = { x: (startNode.x + stopNode.x) / 2, y: (startNode.y + stopNode.y) / 2 };
			m1 = { x: (startNode.x + mid.x) / 2, y: (startNode.y + mid.y) / 2 };
			m2 = { x: (mid.x + stopNode.x) / 2, y: (mid.y + stopNode.y) / 2 };

			const startRadius = startNode.radius / 2;
			const stopRadius  = stopNode.radius  / 2;
			const [ x1, y1 ] = getPathReduction(startRadius, startNode, m1);
			const [ x2, y2 ] = getPathReduction(stopRadius, m2, stopNode);

			m1.x += x1;
			m1.y += y1;
			m2.x -= x2;
			m2.y -= y2;

			this.m1 = m1;
			this.m2 = m2;
		}

		this.m1 = m1;
		this.m2 = m2;
	}

	public id:      string;
	public start:   GraphNode;
	public stop:    GraphNode;
	public m1:      Vec2;
	public m2:      Vec2;
	public updated: string;

	public path:        Canvas2DObject | undefined;
	public pathHandle1: Canvas2DObject | undefined;
	public pathHandle2: Canvas2DObject | undefined;

	public toStorable(): StorableGraphConnection {
		return {
			id:      this.id,
			updated: this.updated,
			start:   this.start.id,
			stop:    this.stop.id,
			m1:      this.m1,
			m2:      this.m2,
		};
	}

}


export class GraphNode implements Vec2 {

	public static isGraphNode(obj: any): obj is GraphNode {
		return obj instanceof GraphNode;
	}

	constructor(
		storable: Partial<StorableGraphNode>
			& Pick<StorableGraphNode, 'x' | 'y'>,
	) {
		const { x, y, id, radius, updated } = storable;

		this.id = id || crypto.randomUUID();
		this.updated = updated || new Date().toISOString();

		this.x  = x;
		this.y  = y;
		this.radius = radius || this.sizes[0]!;
		this.connectionIds = storable.connections || [];

		if (storable.data)
			this.data = allDataNodes.get(storable.data);
	}

	public id:          string;
	public updated:     string;
	public x:           number;
	public y:           number;
	public radius:      number;
	public sizes:       number[] = [ 24, 36, 56 ];
	public path:        Canvas2DObject | undefined;
	public connections: Set<GraphConnection> = new Set();
	public data?:       NodeData;

	protected connectionIds?:        string[];
	protected haveMappedConnections: boolean = false;

	public mapConnections(connections: Map<string, GraphConnection>) {
		if (this.haveMappedConnections)
			return;

		this.haveMappedConnections = true;
		this.connections.clear();

		for (const id of this.connectionIds ?? []) {
			const connection = connections.get(id);
			if (!connection)
				continue;

			this.connections.add(connection);
		}

		delete this.connectionIds;
	}

	public toStorable(): StorableGraphNode {
		const node: StorableGraphNode = {
			id:          this.id,
			updated:     this.updated,
			x:           this.x,
			y:           this.y,
			radius:      this.radius,
			connections: this.connections.values().map(c => c.id).toArray(),
			data:        this.data?.id ?? '',
		};

		return node;
	}

}
