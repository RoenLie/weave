class Mod {

	constructor(public name: string, public description: string) {}

	public toString() {
		return this.name;
	}

}


const mods = {
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


export interface NodeDataCatalog {
	minor:    NodeData[];
	notable:  NodeData[];
	keystone: NodeData[];
}
export interface NodeData {
	id:          string;
	name:        string;
	description: string;
	properties:  Map<string, any>
}


export const nodeDataCatalog: NodeDataCatalog = {
	minor: [
		{
			id:          'attribute',
			name:        'attribute',
			description: '+5 to any attribute',
			properties:  new Map(),
		},
		{
			id:          'armour',
			name:        'armour',
			description: '+20 to armour',
			properties:  new Map(),
		},
		{
			id:          'melee_damage_10',
			name:        'melee_damage_10',
			description: '10% increased melee damage',
			properties:  new Map(),
		},
		{
			id:          'melee_damage_8',
			name:        'melee_damage_8',
			description: '8% increased melee damage',
			properties:  new Map(),
		},
	],
	notable: [
		{
			id:   'raw_power',
			name: '',

			description: `20% increased spell damage. +10 to intelligence`,
			properties:  new Map(),
		},
	],
	keystone: [
		{
			id:          'resolute_technique',
			name:        '',
			description: `Your ${ mods.hits } can't be evaded. Never deal critical strikes.`,
			properties:  new Map(),
		},
		{
			id:          `giant's_blood`,
			name:        '',
			description: `You can wield ${ mods['two-handed_axes'] }, ${ mods.maces }`
			+ ` and ${ mods.swords } in one hand.`
			+ ` Tripple ${ mods.attribute } requirements of weapons.`,
			properties: new Map(),
		},
		{
			id:          `unwavering_stance`,
			name:        '',
			description: `Your ${ mods.stun_treshold } is doubled. Cannot dodge roll`,
			properties:  new Map(),
		},
		{
			id:          `avatar_of_fire`,
			name:        '',
			description: `75% of damage converted to fire damage. Deal no non-fire damage.`,
			properties:  new Map(),
		},
	],
};


export const allDataNodes: Map<string, NodeData> = Object.values(nodeDataCatalog).reduce(
	(acc: Map<string, NodeData>, nodes: NodeData[]) => {
		nodes.forEach(node => acc.set(node.id, node));

		return acc;
	}, new Map<string, NodeData>(),
);
