import type { RGBA } from './color-conversion/rgba.ts';
import { colorMix } from './mixins/color-mix.ts';


/** Tint a color: mix a color with white */
export const tintColor = (color: string | RGBA, weight: number): RGBA => {
	// @function tint-color($color, $weight) {
	//   @return mix(white, $color, $weight);
	// }

	return colorMix({
		colorSpace: 'srgb',
		color1:     'white',
		color2:     color.toString(),
		percent2:   weight,
	});
};


/** Shade a color: mix a color with black */
export const shadeColor = (color: string | RGBA, weight: number): RGBA => {
	// @function shade-color($color, $weight) {
	//   @return mix(black, $color, $weight);
	// }

	return colorMix({
		colorSpace: 'srgb',
		color1:     'black',
		color2:     color.toString(),
		percent2:   weight,
	});
};
