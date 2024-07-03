import { ValueProvider } from '@roenlie/core/types';


/** @internalexport */
export interface IConstraints {
	x: [lower: ValueProvider<number>, upper: ValueProvider<number>],
	y: [lower: ValueProvider<number>, upper: ValueProvider<number>]
}


/** @internalexport */
export type Coordinate = number | string | undefined;


/** @internalexport */
export type Coordinates = [ x: Coordinate, y: Coordinate ];
