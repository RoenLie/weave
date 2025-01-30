import type { Vec2 } from '@roenlie/core/types';


export interface Viewport { x1: number, x2: number, y1: number, y2: number }


export function isOutsideViewport(viewport: Viewport, node: Vec2, padding = 0): boolean {
	const outsideX1 = node.x < viewport.x1;
	const outsideX2 = node.x > viewport.x2;
	const outsideY1 = node.y < viewport.y1;
	const outsideY2 = node.y > viewport.y2;

	return outsideX1 || outsideX2 || outsideY1 || outsideY2;
};
