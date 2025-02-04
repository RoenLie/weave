import { domId } from '@roenlie/core/dom';
import type { Canvas2DObject } from '../pages/canvas-editor/canvas-object.ts';
import type { Optional, Vec2 } from '@roenlie/core/types';
import { getPathReduction } from './path-helpers.ts';


export type StringVec2 = `x${ number }y${ number }`;
export interface ConnectionPoint { id: string, x: number, y: number; }
export interface StorableConnection {
	start: ConnectionPoint;
	stop:  ConnectionPoint;
	m1:    Vec2;
	m2:    Vec2;
	id?:   string;
}
export interface StorableGraphNode {
	x:            number;
	y:            number;
	id?:          string;
	radius?:      number;
	connections?: string[];
	data?:        Record<string, any>;
}


export class Connection {

	constructor(
		nodes: Map<string, GraphNode>,
		storable: Optional<StorableConnection, 'm1' | 'm2'>,
	) {
		let { start, stop, m1, m2, id } = storable;

		this.id    = id || domId();
		this.start = { id: start.id, x: start.x, y: start.y };
		this.stop  = { id: stop.id,   x: stop.x,   y: stop.y };

		if (!m1 || !m2) {
			const mid = { x: (start.x + stop.x) / 2, y: (start.y + stop.y) / 2 };
			m1 = { x: (start.x + mid.x) / 2, y: (start.y + mid.y) / 2 };
			m2 = { x: (mid.x + stop.x) / 2, y: (mid.y + stop.y) / 2 };

			const startRadius = nodes.get(this.start.id)!.radius / 2;
			const stopRadius  = nodes.get(this.stop.id)!.radius  / 2;
			const [ x1, y1 ] = getPathReduction(startRadius, this.start, m1);
			const [ x2, y2 ] = getPathReduction(stopRadius, m2, this.stop);

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

	public id:    string;
	public start: ConnectionPoint;
	public stop:  ConnectionPoint;
	public m1:    Vec2;
	public m2:    Vec2;

	public path:        Canvas2DObject | undefined;
	public pathHandle1: Canvas2DObject | undefined;
	public pathHandle2: Canvas2DObject | undefined;

	public toStorable(): StorableConnection {
		return {
			start: this.start,
			stop:  this.stop,
			m1:    this.m1,
			m2:    this.m2,
			id:    this.id,
		};
	}

}


export class GraphNode {

	public static isGraphNode(obj: any): obj is GraphNode {
		return obj instanceof GraphNode;
	}

	constructor(storable: StorableGraphNode) {
		const { x, y, id, radius } = storable;

		this.x  = x;
		this.y  = y;
		this.id = id || domId();
		this.radius = radius || this.sizes[0]!;
		this.data = new Map(Object.entries(storable.data || {}));
		this.connectionIds = storable.connections || [];
	}

	public id:          string;
	public x:           number;
	public y:           number;
	public radius:      number;
	public sizes:       number[] = [ 24, 36, 56 ];
	public path:        Canvas2DObject | undefined;
	public data:        Map<string, any>;
	public connections: Connection[] = [];

	protected connectionIds:         string[];
	protected haveMappedConnections: boolean = false;

	public mapConnections(connections: Map<string, Connection>) {
		if (this.haveMappedConnections)
			return;

		this.haveMappedConnections = true;
		this.connections.length = 0;

		for (const id of this.connectionIds) {
			const connection = connections.get(id);
			if (!connection)
				continue;

			this.connections.push(connection);
		}
	}

	public toStorable(): StorableGraphNode {
		return {
			x:           this.x,
			y:           this.y,
			id:          this.id,
			radius:      this.radius,
			connections: this.connections.map(c => c.id),
			data:        Object.fromEntries(this.data),
		};
	}

}
