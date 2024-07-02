export const roundToNearest = (num: number, nearest: number) =>
	Math.round(num / nearest) * nearest;

export const ceilToNearest = (num: number, nearest: number) =>
	Math.ceil(num / nearest) * nearest;

export const floorToNearest = (num: number, nearest: number) =>
	Math.floor(num / nearest) * nearest;
