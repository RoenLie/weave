/**
 * Create `count` multiples of the provided `content` string, optionally separated by a `separator`.
 */
export const stringRepeat = (count: number, content: string, seperator = '') => {
	count === Infinity && (count = 0);

	return Array(count).fill(null).map(_ => content).join(seperator);
};
