import type { Vec2 } from '@roenlie/core/types';


export function getPathReduction(radius: number, a: Vec2, b: Vec2): [ number, number ];
export function getPathReduction(radius: number, a: number,  b: number): [ number, number ];
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

	return [ reductionXStart, reductionYStart ] as const;
};


export const getDirectionVector = (start: Vec2, end: Vec2): [x: number, y: number] =>
	[ end.x - start.x, end.y - start.y ];


function isPointInsideRect(
	px: number, py: number,
	x1: number, y1: number,
	x2: number, y2: number,
): boolean {
	return x1 <= px && px <= x2 && y1 <= py && py <= y2;
}

export function isRectInsideAnother(
	Rect1: [number, number, number, number],
	Rect2: [number, number, number, number],
): boolean {
	const [ x1_1, y1_1, x2_1, y2_1 ] = Rect1;
	const [ x1_2, y1_2, x2_2, y2_2 ] = Rect2;

	// Check if any corner of Rect1 is inside Rect2
	if (isPointInsideRect(x1_1, y1_1, x1_2, y1_2, x2_2, y2_2) ||
		 isPointInsideRect(x2_1, y1_1, x1_2, y1_2, x2_2, y2_2) ||
		 isPointInsideRect(x1_1, y2_1, x1_2, y1_2, x2_2, y2_2) ||
		 isPointInsideRect(x2_1, y2_1, x1_2, y1_2, x2_2, y2_2))
		return true;

	// Check if any corner of Rect2 is inside Rect1
	if (isPointInsideRect(x1_2, y1_2, x1_1, y1_1, x2_1, y2_1) ||
		 isPointInsideRect(x2_2, y1_2, x1_1, y1_1, x2_1, y2_1) ||
		 isPointInsideRect(x1_2, y2_2, x1_1, y1_1, x2_1, y2_1) ||
		 isPointInsideRect(x2_2, y2_2, x1_1, y1_1, x2_1, y2_1))
		return true;


	return false;
}
