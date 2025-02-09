import { domId } from '@roenlie/core/dom';
import type { Canvas2DObject } from '../../pages/canvas-editor/canvas-object.ts';
import type { Optional, Vec2 } from '@roenlie/core/types';
import { getPathReduction } from '../canvas/path-helpers.ts';


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
	data?:        {
		name:        string;
		description: string;
		properties:  Record<string, any>;
	};
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
		this.connectionIds = storable.connections || [];
		this.data = {
			name:        '',
			description: '',
			...storable.data,
			properties:  new Map(Object.entries(storable.data?.properties || {})),
		};
	}

	public id:          string;
	public x:           number;
	public y:           number;
	public radius:      number;
	public sizes:       number[] = [ 24, 36, 56 ];
	public path:        Canvas2DObject | undefined;
	public connections: Connection[] = [];
	public data:        {
		name:        string;
		description: string;
		properties:  Map<string, any>;
	};


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
			data:        {
				name:        this.data.name,
				description: this.data.description,
				properties:  Object.fromEntries(this.data.properties),
			},
		};
	}

}


class Mod {

	constructor(public name: string, public description: string) {}

	public toString() {
		return this.name;
	}

}


const mod = {
	hits: new Mod('hits',
		'Any damage that is not a Damage Over Time is hit damage.'),
	evaded: {
		name:        'evaded',
		description: '',
	},
	critical_hits: {
		name:        'critical_hits',
		description: '',
	},
	'two-handed_axes': {
		name:        'two-handed_axes',
		description: '',
	},
	maces: {
		name:        'maces',
		description: '',
	},
	swords: {
		name:        'swords',
		description: '',
	},
	attribute: {
		name:        'attribute',
		description: '',
	},
	stun_treshold: {
		name:        'stun_treshold',
		description: '',
	},
};


export const nodeTypes = [
	{
		name:  'minor',
		nodes: [
			{
				name:        'attribute',
				description: '+5 to any attribute',
			},
		],
	},
	{
		name:  'notable',
		nodes: [
			{
				name:        'raw_power',
				description: `20% increased spell damage. +10 to intelligence`,
			},
		],
	},
	{
		name:  'keystone',
		nodes: [
			{
				name:        'resolute_technique',
				description: `Your ${ mod.hits } can't be evaded. Never deal critical strikes.`,
			},
			{
				name:        `giant's_blood`,
				description: `You can wield ${ mod['two-handed_axes'] }, ${ mod.maces }`
				+ ` and ${ mod.swords } in one hand.`
				+ ` Tripple ${ mod.attribute } requirements of weapons.`,
			},
			{
				name:        `unwavering_stance`,
				description: `Your ${ mod.stun_treshold } is doubled. Cannot dodge roll`,
			},
			{
				name:        `Avatar of Fire`,
				description: `75% of damage converted to fire damage. Deal no non-fire damage.`,
			},
		],
	},
];
