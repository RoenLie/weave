export const GraphTree = (class GraphTree<T extends Record<string, GraphNode>> {

	constructor(protected nodes: T) {
		return new Proxy(this, {
			get: (target, prop) => {
				if (prop in target)
					return (target as Record<keyof any, any>)[prop];
				if (prop in nodes)
					return (nodes as Record<keyof any, any>)[prop];

				return undefined;
			},
			set: (target, prop, value) => {
				if (prop in target)
					(target as Record<keyof any, any>)[prop] = value;
				else
					(nodes as Record<keyof any, any>)[prop] = value;

				return true;
			},
		});
	}

}) as {
	new <T extends Record<string, GraphNode>>(nodes: T): T;
	prototype: object;
};


export class GraphNode {

	public connections: GraphNode[] = [];
	constructor(
		public x: number,
		public y: number,
		public id: string,
	) {}

}

//const tree = new GraphTree({
//	witch1SpellDmg:          new GraphNode(400, 400, 'witch1SpellDmg'),
//	witch2SpellDmg:          new GraphNode(350, 250, 'witch2SpellDmg'),
//	witch2Attribute1:        new GraphNode(325, 300, 'witch2Attribute'),
//	witch3SpellDmg:          new GraphNode(270, 200, 'witch3SpellDmg'),
//	witch3ManaRegen:         new GraphNode(360, 170, 'witch3ManaRegen'),
//	witch4SpellDmg:          new GraphNode(280, 150, 'witch3SpellDmg'),
//	witch4ManaRegen:         new GraphNode(310, 140, 'witch4ManaRegen'),
//	witch1EnergyShield:      new GraphNode(500, 400, 'witch1EnergyShield'),
//	witch2EnergyShield:      new GraphNode(550, 250, 'witch1EnergyShield'),
//	witch2Attribute2:        new GraphNode(575, 300, 'witch1EnergyShield'),
//	witch3EnergyShield:      new GraphNode(525, 170, 'witch1EnergyShield'),
//	witch3EnergyShieldDelay: new GraphNode(555, 170, 'witch1EnergyShield'),
//});

//console.log(tree);


//tree.witch1SpellDmg.connections     = [ tree.witch2Attribute1, tree.witch2SpellDmg ];
//tree.witch2SpellDmg.connections     = [ tree.witch3SpellDmg, tree.witch3ManaRegen ];
//tree.witch3SpellDmg.connections     = [ tree.witch4SpellDmg ];
//tree.witch3ManaRegen.connections    = [ tree.witch4ManaRegen ];
//tree.witch1EnergyShield.connections = [ tree.witch2Attribute2, tree.witch2EnergyShield ];
//tree.witch2EnergyShield.connections = [ tree.witch3EnergyShield, tree.witch3EnergyShieldDelay ];


//export const graph = [ tree.witch1SpellDmg, tree.witch1EnergyShield ];
