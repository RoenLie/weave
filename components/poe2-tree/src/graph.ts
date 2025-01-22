import { domId } from '@roenlie/core/dom';


export interface Vector2 { x: number, y: number; }

export interface ConnectionPoint { id: string, x: number, y: number; }

export interface StorableConnection {
	start:   ConnectionPoint;
	end:     ConnectionPoint;
	middle?: Vector2;
	id?:     string;
}
export interface StorableGraphNode {
	x:            number;
	y:            number;
	id?:          string;
	radius?:      number;
	connections?: string[];
	data?:        NodeData;
}

export interface NodeData {
	name: string;
	type: 'small' | 'medium' | 'large';
}


export class Connection {

	constructor(storable: StorableConnection) {
		const { start, end, middle, id } = storable;

		this.id     = id || domId();
		this.start  = { id: start.id, x: start.x, y: start.y };
		this.end    = { id: end.id,   x: end.x,   y: end.y };
		this.middle = middle || { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
	}

	public id:     string;
	public start:  ConnectionPoint;
	public middle: Vector2;
	public end:    ConnectionPoint;

	public toStorable(): StorableConnection {
		return {
			start:  this.start,
			end:    this.end,
			middle: this.middle,
			id:     this.id,
		};
	}

}


export class GraphNode {

	constructor(storable: StorableGraphNode) {
		const { x, y, id, radius, connections } = storable;

		this.x  = x;
		this.y  = y;
		this.id = id || domId();
		this.radius = radius || 7;
		this.connections = connections || [];
	}

	public id:          string;
	public x:           number;
	public y:           number;
	public connections: string[];
	public radius:      number;
	public data: NodeData = {
		name: '',
		type: 'small',
	};

	public toStorable(): StorableGraphNode {
		return {
			x:           this.x,
			y:           this.y,
			id:          this.id,
			radius:      this.radius,
			connections: this.connections,
			data:        this.data,
		};
	}

}
