/**
 * Returns a number rounded to the nearest increment of the second parameter.
 */
export const roundToNearest = (numToRound: number, numToRoundTo: number): number =>
	Math.round(numToRound / numToRoundTo) * numToRoundTo;
