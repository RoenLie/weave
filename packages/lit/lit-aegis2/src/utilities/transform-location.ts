import type { LocationMapper, LocationResult } from '../app.types.ts';


/**
 * Transform the output of the provided `locationMapper` to a `TLocation` object.
 */
export const transformLocation = <TLocation extends object = Record<string, string>>(
	locationMapper: LocationMapper,
): TLocation => {
	const loc = locationMapper();

	return transformLocationResult(loc);
};

/**
 * Transform the `LocationResult` to a `TLocation` object.
 */
export const transformLocationResult = <TLocation extends object = Record<string, string>>(
	result: LocationResult,
): TLocation => {
	const { from, to } = result;
	const context: Record<string, string> = {};
	for (let i = 0; i < from.length; i++)
		context[from[i]!] = to[i]!;

	return context as TLocation;
};
