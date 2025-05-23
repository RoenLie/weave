// https://github.com/twbs/bootstrap/blob/5c75fda23160dace4c0e6ed62dce37b6b1109350/scss/_functions.scss

import { style } from '../style-variables.ts';
import { RGBA } from './color-conversion/rgba.ts';
import { colorMix, convertToRgb, rgbToString } from './mixins/color-mix.ts';


// Color contrast
// See https://github.com/twbs/bootstrap/pull/30168
export const colorContrast = (args: {
	background:          string;
	colorContrastDark?:  string;
	colorContrastLight?: string;
	minContrastRatio?:   number;
}): string => {
	//@function color-contrast(
	// $background,
	// $color-contrast-dark: $color-contrast-dark,
	// $color-contrast-light: $color-contrast-light,
	// $min-contrast-ratio: $min-contrast-ratio
	// ) {
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


export const contrastRatio = (
	background: string,
	foreground: string = style.vars.get('color-contrast-light'),
): number => {
	//@function contrast-ratio($background, $foreground: $color-contrast-light) {
	//	$l1: luminance($background);
	//	$l2: luminance(opaque($background, $foreground));

	//	@return if($l1 > $l2, divide($l1 + .05, $l2 + .05), divide($l2 + .05, $l1 + .05));
	// }

	const l1 = luminance(background);
	const l2 = luminance(opaque(background, foreground));

	return l1 > l2
		? (l1 + .05) / (l2 + .05)
		: (l2 + .05) / (l1 + .05);
};


/**
 * Return WCAG2.2 relative luminance
 * See https://www.w3.org/TR/WCAG/#dfn-relative-luminance
 * See https://www.w3.org/TR/WCAG/#dfn-contrast-ratio
 */
export const luminance = (color: string | RGBA): number => {
	const rgbTuple = color instanceof RGBA
		? color.slice(0, -1)
		: convertToRgb(color).slice(0, -1);

	const rgb = rgbTuple.map(value => {
		if (value / 255 < .04045)
			return value / 255 / 12.92;

		const index = Math.min(
			_luminanceList.length - 1,
			Math.max(0, Math.round(value) + 1),
		);

		return _luminanceList[index]!;
	}) as [number, number, number];

	return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
};


const _luminanceList: number[] = [
	0.0008,
	0.001,
	0.0011,
	0.0013,
	0.0015,
	0.0017,
	0.002,
	0.0022,
	0.0025,
	0.0027,
	0.003,
	0.0033,
	0.0037,
	0.004,
	0.0044,
	0.0048,
	0.0052,
	0.0056,
	0.006,
	0.0065,
	0.007,
	0.0075,
	0.008,
	0.0086,
	0.0091,
	0.0097,
	0.0103,
	0.011,
	0.0116,
	0.0123,
	0.013,
	0.0137,
	0.0144,
	0.0152,
	0.016,
	0.0168,
	0.0176,
	0.0185,
	0.0194,
	0.0203,
	0.0212,
	0.0222,
	0.0232,
	0.0242,
	0.0252,
	0.0262,
	0.0273,
	0.0284,
	0.0296,
	0.0307,
	0.0319,
	0.0331,
	0.0343,
	0.0356,
	0.0369,
	0.0382,
	0.0395,
	0.0409,
	0.0423,
	0.0437,
	0.0452,
	0.0467,
	0.0482,
	0.0497,
	0.0513,
	0.0529,
	0.0545,
	0.0561,
	0.0578,
	0.0595,
	0.0612,
	0.063,
	0.0648,
	0.0666,
	0.0685,
	0.0704,
	0.0723,
	0.0742,
	0.0762,
	0.0782,
	0.0802,
	0.0823,
	0.0844,
	0.0865,
	0.0887,
	0.0908,
	0.0931,
	0.0953,
	0.0976,
	0.0999,
	0.1022,
	0.1046,
	0.107,
	0.1095,
	0.1119,
	0.1144,
	0.117,
	0.1195,
	0.1221,
	0.1248,
	0.1274,
	0.1301,
	0.1329,
	0.1356,
	0.1384,
	0.1413,
	0.1441,
	0.147,
	0.15,
	0.1529,
	0.1559,
	0.159,
	0.162,
	0.1651,
	0.1683,
	0.1714,
	0.1746,
	0.1779,
	0.1812,
	0.1845,
	0.1878,
	0.1912,
	0.1946,
	0.1981,
	0.2016,
	0.2051,
	0.2086,
	0.2122,
	0.2159,
	0.2195,
	0.2232,
	0.227,
	0.2307,
	0.2346,
	0.2384,
	0.2423,
	0.2462,
	0.2502,
	0.2542,
	0.2582,
	0.2623,
	0.2664,
	0.2705,
	0.2747,
	0.2789,
	0.2831,
	0.2874,
	0.2918,
	0.2961,
	0.3005,
	0.305,
	0.3095,
	0.314,
	0.3185,
	0.3231,
	0.3278,
	0.3325,
	0.3372,
	0.3419,
	0.3467,
	0.3515,
	0.3564,
	0.3613,
	0.3663,
	0.3712,
	0.3763,
	0.3813,
	0.3864,
	0.3916,
	0.3968,
	0.402,
	0.4072,
	0.4125,
	0.4179,
	0.4233,
	0.4287,
	0.4342,
	0.4397,
	0.4452,
	0.4508,
	0.4564,
	0.4621,
	0.4678,
	0.4735,
	0.4793,
	0.4851,
	0.491,
	0.4969,
	0.5029,
	0.5089,
	0.5149,
	0.521,
	0.5271,
	0.5333,
	0.5395,
	0.5457,
	0.552,
	0.5583,
	0.5647,
	0.5711,
	0.5776,
	0.5841,
	0.5906,
	0.5972,
	0.6038,
	0.6105,
	0.6172,
	0.624,
	0.6308,
	0.6376,
	0.6445,
	0.6514,
	0.6584,
	0.6654,
	0.6724,
	0.6795,
	0.6867,
	0.6939,
	0.7011,
	0.7084,
	0.7157,
	0.7231,
	0.7305,
	0.7379,
	0.7454,
	0.7529,
	0.7605,
	0.7682,
	0.7758,
	0.7835,
	0.7913,
	0.7991,
	0.807,
	0.8148,
	0.8228,
	0.8308,
	0.8388,
	0.8469,
	0.855,
	0.8632,
	0.8714,
	0.8796,
	0.8879,
	0.8963,
	0.9047,
	0.9131,
	0.9216,
	0.9301,
	0.9387,
	0.9473,
	0.956,
	0.9647,
	0.9734,
	0.9823,
	0.9911,
	1,
];


export const opaque = (background: string | RGBA, foreground: string | RGBA): RGBA => {
	// opaque(#fff, rgba(0, 0, 0, .5)) => #808080
	// @function opaque($background, $foreground) {
	//   @return mix(rgba($foreground, 1), $background, opacity($foreground) * 100%);
	// }

	const foregroundRGB = foreground instanceof RGBA
		? foreground
		: convertToRgb(foreground);

	foregroundRGB[3] = 1; // Set alpha to 1

	return colorMix({
		colorSpace: 'srgb',
		color1:     rgbToString(foregroundRGB),
		color2:     background,
		percent2:   opacity(foreground),
	});
};


export const opacity = (color: string | RGBA): number => {
	const rgba = color instanceof RGBA
		? color
		: convertToRgb(color);

	return rgba[3]! * 100;
};
