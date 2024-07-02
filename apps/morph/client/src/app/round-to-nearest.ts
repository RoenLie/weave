export const roundToNearest = (numToRound: number, numToRoundTo: number) =>
	Math.round(numToRound / numToRoundTo) * numToRoundTo;
