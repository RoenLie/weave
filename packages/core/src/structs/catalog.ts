import { type RecordOf } from '../types/record.types.js';


export interface Catalog<TObj extends object, TValue> {
	catalog: { [P in keyof TObj]: TValue; } & Record<string, TValue>;
	use:     RecordOf<Use<TObj>>;
}


/** Describes sorting and inclusion of TCatalog entries as a list of items. */
export type Use<TCatalog extends object = Record<string, any>> = {
	[P in string & keyof TCatalog]?: boolean | number;
};


/** Build a list of items based on the record and use supplied. */
export const catalogToList = <TRec extends { catalog: Record<string, any>; use?: Use<TRec>; }>(
	record: TRec,
): TRec['catalog'][keyof TRec['catalog']][] => {
	const keys = record.use
		? getUsage(record.use)
		: Object.keys(record.catalog);

	return keys.map((key: string) => record.catalog[key]);
};


/** Get a filtered and sorted list of keys to `use`. */
export const getUsage = <TCatalog extends Record<string, any>>(
	use: Use<TCatalog>,
): (string & keyof TCatalog)[] => useSort(use, Object.keys(use));


export const useContains = (use: Use, name: string): boolean => {
	const usage = use[name];

	return usage === true
		|| typeof usage === 'number'
		|| (typeof usage === 'object' && usage !== null);
};


export const useCompare = (use: Use, a: string, b: string): number => {
	const o1 = use[a],
		o2 = use[b];

	if (o1 === o2)
		return 0;
	if (o1 === true)
		return 1;
	if (o2 === true)
		return -1;
	if (o2 === false || o2 === undefined)
		return 1;
	if (o1 === false || o1 === undefined)
		return -1;

	return (o1 > o2 ? 1 : -1);
};


const isUseObject = (use?: Use): use is Use => use !== null && typeof use === 'object';


export const useSort = (use: Use | undefined, names: string[]): string[] => {
	if (!isUseObject(use))
		throw new Error("Cannot sort by use when no 'use' is provided!");

	return names
		.filter(n => useContains(use, n))
		.sort((a, b) => useCompare(use, a, b));
};
