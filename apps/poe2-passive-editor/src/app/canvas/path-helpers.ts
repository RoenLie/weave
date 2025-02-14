import type { Repeat, Vec2 } from '@roenlie/core/types';


export function getPathReduction(radius: number, a: Vec2, b: Vec2): [x: number, y: number];
export function getPathReduction(radius: number, a: number,  b: number): [x: number, y: number];
export function getPathReduction(radius: number, a: number | Vec2, b: number | Vec2): any {
	if (typeof a === 'object' && typeof b === 'object')
		[ a, b ] = getDirectionVector(a, b);

	if (typeof a !== 'number' || typeof b !== 'number')
		throw new Error('Invalid arguments');

	// Calculate the length of the direction vector
	const lengthStart = Math.sqrt(a * a + b * b);

	// Normalize the direction vector
	const nxStart = a / lengthStart;
	const nyStart = b / lengthStart;

	// Scale the normalized vector by the radius
	const reductionXStart = nxStart * radius;
	const reductionYStart = nyStart * radius;

	return [ reductionXStart, reductionYStart ];
};


export const getDirectionVector = (start: Vec2, end: Vec2): [x: number, y: number] =>
	[ end.x - start.x, end.y - start.y ];


export const doRectsOverlap = (
	rect1: Repeat<4, number>,
	rect2: Repeat<4, number>,
): boolean => {
	const [ x1_1, y1_1, x2_1, y2_1 ] = rect1;
	const [ x1_2, y1_2, x2_2, y2_2 ] = rect2;

	// Return true if the rectangles overlap
	// (i.e., if none of the following conditions for NO overlap are met)
	return !(
		x2_1 < x1_2    // rect1 is to the left of rect2
		|| x1_1 > x2_2 // rect1 is to the right of rect2
		|| y2_1 < y1_2 // rect1 is above rect2
		|| y1_1 > y2_2 // rect1 is below rect2
	);
};
