import { style } from '../style-variables.ts';

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


// Color contrast
// See https://github.com/twbs/bootstrap/pull/30168
export const colorContrast = (args: {
	background:          string;
	colorContrastDark?:  string;
	colorContrastLight?: string;
	minContrastRatio?:   number;
}) => {
	args.colorContrastDark  ??= style.vars.get('color-contrast-dark');
	args.colorContrastLight ??= style.vars.get('color-contrast-light');
	args.minContrastRatio   ??= style.vars.getNumber('min-contrast-ratio');

	const foregrounds = [
		args.colorContrastLight,
		args.colorContrastDark,
		style.vars.get('white'),
		style.vars.get('black'),
	];

	let maxRatio = 0;
	let maxRatioColor: string = '';

	for (const color of foregrounds) {
		const ratio = contrastRatio(args.background, color);
		if (ratio > args.minContrastRatio)
			return color;

		if (ratio > maxRatio) {
			maxRatio = ratio;
			maxRatioColor = color;
		}
	}

	return maxRatioColor;
};

//#region color-contrast
//@function color-contrast($background, $color-contrast-dark: $color-contrast-dark, $color-contrast-light: $color-contrast-light, $min-contrast-ratio: $min-contrast-ratio) {
//  $foregrounds: $color-contrast-light, $color-contrast-dark, $white, $black;
//  $max-ratio: 0;
//  $max-ratio-color: null;

//  @each $color in $foregrounds {
//    $contrast-ratio: contrast-ratio($background, $color);
//    @if $contrast-ratio > $min-contrast-ratio {
//      @return $color;
//    } @else if $contrast-ratio > $max-ratio {
//      $max-ratio: $contrast-ratio;
//      $max-ratio-color: $color;
//    }
//  }

//  @warn "Found no color leading to #{$min-contrast-ratio}:1 contrast ratio against #{$background}...";

//  @return $max-ratio-color;
//}
//#endregion

//#region contrast-ratio
//@function contrast-ratio($background, $foreground: $color-contrast-light) {
//	$l1: luminance($background);
//	$l2: luminance(opaque($background, $foreground));

//	@return if($l1 > $l2, divide($l1 + .05, $l2 + .05), divide($l2 + .05, $l1 + .05));
// }
//#endregion


export const luminance = (color: string) => {
	// Need to extract red green and blue values from color
	// Color can be in hex, rgb, rgba, hsl, hsla, or named color
	// Create a helper function to extract the red, green, and blue values from the color
	// How to convert all the things, see below.
	// See https://css-tricks.com/converting-color-spaces-in-javascript/


};


//#region luminance
// // Return WCAG2.2 relative luminance
// // See https://www.w3.org/TR/WCAG/#dfn-relative-luminance
// // See https://www.w3.org/TR/WCAG/#dfn-contrast-ratio
// @function luminance($color) {
//	$rgb: (
//	  "r": red($color),
//	  "g": green($color),
//	  "b": blue($color)
//	);

//	@each $name, $value in $rgb {
//	  $value: if(divide($value, 255) < .04045, divide(divide($value, 255), 12.92), nth($_luminance-list, $value + 1));
//	  $rgb: map-merge($rgb, ($name: $value));
//	}

//	@return (map-get($rgb, "r") * .2126) + (map-get($rgb, "g") * .7152) + (map-get($rgb, "b") * .0722);
// }
//#endregion
