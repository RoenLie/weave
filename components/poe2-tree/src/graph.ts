import { domId } from '@roenlie/core/dom';


interface Vector2 { x: number, y: number; }
interface ConnectionPoint { id: string, x: number, y: number; }

export class Connection {

	constructor(start: GraphNode, end: GraphNode, id?: string) {
		this.id     = id || domId();
		this.start  = { id: start.id, x: start.x, y: start.y };
		this.end    = { id: end.id,   x: end.x,   y: end.y };
		this.middle = { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
	}

	public id:     string;
	public start:  ConnectionPoint;
	public middle: Vector2;
	public end:    ConnectionPoint;

}


export class GraphNode {

	constructor(
		public x: number,
		public y: number,
		id?: string,
	) {
		this.id = id || domId();
	}

	public id:          string;
	public connections: string[] = [];

}


export class StorableGraphNode extends GraphNode {

	constructor(node: GraphNode) {
		super(node.x, node.y, node.id);
		this.connections = node.connections;
	}

}
