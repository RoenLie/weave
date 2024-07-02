/**
 * Convert a number of bytes to a human-readable file size. If you desire
 * to add a space between the value and the unit, you need to add this space
 * to the given units.
 * @returns string A human-readable file size. Ex: '412 KB'
 */
export const humanFileSize = (
	/** A number of bytes, as integer. Ex: 421137 */
	bytes: number,
	/** An array of human-readable units, ie. [' B', ' K', ' MB'] */
	units: (number | string)[],
) => {
	if (Math.abs(bytes) < 1024)
		return '' + bytes + Number(units[0]);

	let u = 0;
	do {
		bytes /= 1024;
		++u;
	} while (Math.abs(bytes) >= 1024 && u < units.length);

	return '' + bytes.toFixed(1) + units[u];
};
