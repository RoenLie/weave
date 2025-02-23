import type { Vec2 } from '@roenlie/core/types';


export interface Viewport { x1: number, x2: number, y1: number, y2: number }


export const isOutsideViewport = (viewport: Viewport, node: Vec2, offset = 50): boolean => {
	const outsideX1 = node.x < (viewport.x1 - offset);
	const outsideX2 = node.x > (viewport.x2 + offset);
	const outsideY1 = node.y < (viewport.y1 - offset);
	const outsideY2 = node.y > (viewport.y2 + offset);

	return outsideX1 || outsideX2 || outsideY1 || outsideY2;
};
