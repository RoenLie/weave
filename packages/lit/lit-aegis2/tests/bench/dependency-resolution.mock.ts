export const loaderCache = new Map([
	[
		'SYS.CORP.ROOT',
		new Map([
			[ 'common', [ { dependencies: [ 'utilities', 'database', 'entity' ] } ] ],
			[ 'utilities', [ { dependencies: [ 'database' ] } ] ],
			[ 'database', [ { dependencies: [ 'entity' ] } ] ],
			[ 'entity', [ { dependencies: [] } ] ],
		]),
	],
]);


export const recursion = (locations: string[], ...pluginIds: (string)[]) => {
	const pluginIdSet = new Set(pluginIds);
	const locationMap = loaderCache;

	const dependencyIds = locations.reduce((acc, locationId) => {
		if (!locationMap.has(locationId))
			return acc;

		const entry = locationMap.get(locationId)!;

		const findDependencies = (
			pluginId: string,
			dependencies = new Set<string>(),
		) => {
			const pluginEntries = entry.get(pluginId);
			const dependencyIds = pluginEntries?.flatMap(ent => ent.dependencies);

			dependencyIds?.forEach(depId => {
				if (!dependencies.has(depId) && !pluginIdSet.has(depId)) {
					dependencies.add(depId);
					findDependencies(depId, dependencies);
				}
			});

			return [ ...dependencies ];
		};

		pluginIdSet.forEach(id => acc.push(...findDependencies(id)));

		return acc;
	}, [] as string[]);


	return [ ...new Set([ ...pluginIdSet, ...dependencyIds ]) ];
};

export const iteration = (locations: string[], ...pluginIds: (string)[]) => {
	const locationMap = loaderCache;

	const dependencyIds = new Set(pluginIds);
	for (const locationId of locations) {
		const entry = locationMap.get(locationId);
		if (!entry)
			continue;

		for (const pluginId of pluginIds) {
			const leads = [ pluginId ];

			for (const id of leads) {
				const pluginEntries = entry.get(id);
				const depIds = pluginEntries?.flatMap(ent => ent.dependencies);
				depIds?.forEach(depId => {
					if (!dependencyIds.has(depId)) {
						dependencyIds.add(depId);
						leads.push(depId);
					}
				});
			}
		}
	}

	return [ ...dependencyIds ];
};
