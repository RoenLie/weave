import type { Vector2 } from './graph.ts';


export function getPathReduction(radius: number, a: Vector2, b: Vector2): [ number, number ];
export function getPathReduction(radius: number, a: number,  b: number): [ number, number ];
export function getPathReduction(radius: number, a: number | Vector2, b: number | Vector2): any {
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


export const getDirectionVector = (start: Vector2, end: Vector2): [x: number, y: number] =>
	[ end.x - start.x, end.y - start.y ];
