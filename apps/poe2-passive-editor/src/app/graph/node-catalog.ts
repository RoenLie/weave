export interface NodeData {
	type:        'minor' | 'notable' | 'keystone';
	id:          string;
	name:        string;
	description: string;
}


export const modifiers = [
	{
		name:        'hits',
		description: 'Any damage that is not a Damage Over Time is hit damage.',
	},
	{
		name:        'evaded',
		description: '',
	},
	{
		name:        'critical_hits',
		description: '',
	},
	{
		name:        'two-handed_axes',
		description: '',
	},
	{
		name:        'maces',
		description: '',
	},
	{
		name:        'swords',
		description: '',
	},
	{
		name:        'attribute',
		description: '',
	},
	{
		name:        'stun_treshold',
		description: '',
	},
];


export const nodeDataCatalog: NodeData[] = [
	{
		type:        'minor',
		id:          'attribute',
		name:        'attribute',
		description: '+5 to any attribute',
	},
	{
		type:        'minor',
		id:          'armour',
		name:        'armour',
		description: '+20 to armour',
	},
	{
		type:        'minor',
		id:          'melee_damage_10',
		name:        'melee_damage_10',
		description: '10% increased melee damage',
	},
	{
		type:        'minor',
		id:          'melee_damage_8',
		name:        'melee_damage_8',
		description: '8% increased melee damage',
	},
	{
		type:        'notable',
		id:          'raw_power',
		name:        '',
		description: `20% increased spell damage. +10 to intelligence`,
	},
	{
		type:        'keystone',
		id:          'resolute_technique',
		name:        '',
		description: `Your {hits} can't be evaded. Never deal critical strikes.`,
	},
	{
		type:        'keystone',
		id:          `giant's_blood`,
		name:        '',
		description: `
		You can wield {two-handed_axes}, {maces} and {swords} in one hand.
		Tripple {attribute} requirements of weapons.`,
	},
	{
		type:        'keystone',
		id:          `unwavering_stance`,
		name:        '',
		description: `Your {stun_treshold} is doubled. Cannot dodge roll`,
	},
	{
		type:        'keystone',
		id:          `avatar_of_fire`,
		name:        '',
		description: `75% of damage converted to fire damage. Deal no non-fire damage.`,
	},
];


export const dataNodes: Map<string, NodeData> = nodeDataCatalog.reduce(
	(acc, node) => { return acc.set(node.id, node), acc; },
	new Map<string, NodeData>(),
);
