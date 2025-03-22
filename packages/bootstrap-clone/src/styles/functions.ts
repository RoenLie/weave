import { styleVariables } from '../style-variables.ts';


/** Tint a color: mix a color with white */
export const tintColor = (color: string, weight: number): string => {
	//@function tint-color($color, $weight) {
	//	@return mix(white, $color, $weight);
	//}

	return `color-mix(in srgb, white, ${ color } ${ weight }%)`;
};

/** Shade a color: mix a color with black */
export const shadeColor = (color: string, weight: number): string => {
	// @function shade-color($color, $weight) {
	//	@return mix(black, $color, $weight);
	// }

	return `color-mix(in srgb, black, ${ color } ${ weight }%)`;
};



