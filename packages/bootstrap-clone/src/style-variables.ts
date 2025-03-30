/* eslint-disable @stylistic/max-len */

import { shadeColor, tintColor } from './styles/modify-color.ts';


class StyleMap extends Map<string, string | number | undefined> {

	override get(key: string): string {
		const value = super.get(key);
		if (value === undefined)
			throw new Error(`Variable "${ key }" is not defined.`);

		return String(value);
	}

	getNumber(key: string): number {
		return Number(this.get(key));
	}

}


type StyleProxy = StyleMap & Record<string, string> & Record<never, never>;


const createStyleProxy = () => {
	const map = new StyleMap();

	const proxy = new Proxy(map as StyleMap & Record<keyof any, any>, {
		get(target, p, receiver) {
			if (p in target) {
				if (typeof target[p] === 'function')
					return target[p].bind(target);

				return Reflect.get(target, p, receiver);
			}

			return target.get(p as string);
		},
		set(target, p, newValue, receiver) {
			target.set(p as string, newValue);

			return true;
		},
	});

	return proxy as StyleProxy;
};


export const createStyleVariables = (options: {
	prefix: string;
}): StyleProxy => {
	const { prefix } = options;
	const vars = createStyleProxy();

	//#region color system
	//#region gray-color-variables
	vars['white'   ] = '#fff';
	vars['gray-100'] = '#f8f9fa';
	vars['gray-200'] = '#e9ecef';
	vars['gray-300'] = '#dee2e6';
	vars['gray-400'] = '#ced4da';
	vars['gray-500'] = '#adb5bd';
	vars['gray-600'] = '#6c757d';
	vars['gray-700'] = '#495057';
	vars['gray-800'] = '#343a40';
	vars['gray-900'] = '#212529';
	vars['black'   ] = '#000';
	//#endregion gray-color-variables


	//#region color-variables
	vars.set('blue',   '#0d6efd');
	vars.set('indigo', '#6610f2');
	vars.set('purple', '#6f42c1');
	vars.set('pink',   '#d63384');
	vars.set('red',    '#dc3545');
	vars.set('orange', '#fd7e14');
	vars.set('yellow', '#ffc107');
	vars.set('green',  '#198754');
	vars.set('teal',   '#20c997');
	vars.set('cyan',   '#0dcaf0');
	//#endregion color-variables

	// The contrast ratio to reach against white, to determine if color changes from "light" to "dark".
	// Acceptable values for WCAG 2.2 are 3, 4.5 and 7.
	// See https://www.w3.org/TR/WCAG/#contrast-minimum
	vars.set('min-contrast-ratio', 4.5);

	// Customize the light and dark text colors for use in our color contrast function.
	vars.set('color-contrast-dark',  vars.get('black'));
	vars.set('color-contrast-light', vars.get('white'));

	//#region theme-color-variables
	vars.set('primary',   vars.get('blue'));
	vars.set('secondary', vars.get('gray-600'));
	vars.set('success',   vars.get('green'));
	vars.set('info',      vars.get('cyan'));
	vars.set('warning',   vars.get('yellow'));
	vars.set('danger',    vars.get('red'));
	vars.set('light',     vars.get('gray-100'));
	vars.set('dark',      vars.get('gray-900'));
	//#endregion theme-color-variables


	//#region theme-text-variables
	vars.set('primary-text-emphasis',   shadeColor(vars.get('primary'),   60));
	vars.set('secondary-text-emphasis', shadeColor(vars.get('secondary'), 60));
	vars.set('success-text-emphasis',   shadeColor(vars.get('success'),   60));
	vars.set('info-text-emphasis',      shadeColor(vars.get('info'),      60));
	vars.set('warning-text-emphasis',   shadeColor(vars.get('warning'),   60));
	vars.set('danger-text-emphasis',    shadeColor(vars.get('danger'),    60));
	vars.set('light-text-emphasis',     vars.get('gray-700'));
	vars.set('dark-text-emphasis',      vars.get('gray-700'));
	//#endregion theme-text-variables
	//#endregion color system


	//#region options
	// Quickly modify global styling by enabling or disabling optional features.
	vars.set('enable-caret',                'true');
	vars.set('enable-rounded',              'true');
	vars.set('enable-shadows',              'false');
	vars.set('enable-gradients',            'false');
	vars.set('enable-transitions',          'true');
	vars.set('enable-reduced-motion',       'true');
	vars.set('enable-smooth-scroll',        'true');
	vars.set('enable-grid-classes',         'true');
	vars.set('enable-container-classes',    'true');
	vars.set('enable-cssgrid',              'false');
	vars.set('enable-button-pointers',      'true');
	vars.set('enable-rfs',                  'true');
	vars.set('enable-validation-icons',     'true');
	vars.set('enable-negative-margins',     'false');
	vars.set('enable-deprecation-messages', 'true');
	vars.set('enable-important-utilities',  'true');

	vars.set('enable-dark-mode',            'true');
	vars.set('color-mode-type:',            'data'); // `data` or `media-query'

	// prefix for :root CSS variables
	vars.set('variable-prefix',             'bs-'); // Deprecated in v5.2.0 for the shorter `$prefix'
	vars.set('prefix',                      vars.get('variable-prefix'));
	//#endregion options


	//#region body
	vars.set('body-text-align',      '');
	vars.set('body-color',           vars.get('gray-900'));
	vars.set('body-bg',              vars.get('white'));
	vars.set('body-secondary-color', `rgba(${ vars.get('body-color') }, .75)`);
	vars.set('body-secondary-bg',    vars.get('gray-200'));
	vars.set('body-tertiary-color',  `rgba(${ vars.get('body-color') }, .5)`);
	vars.set('body-tertiary-bg',     vars.get('gray-100'));
	vars.set('body-emphasis-color',  vars.get('black'));
	//#endregion body


	//#region links
	// Style anchor elements.

	vars.set('link-color',            `${ vars.get('primary') }`);
	vars.set('link-decoration',       'underline');
	vars.set('link-shade-percentage', '20%');
	vars.set('link-hover-color',      `shift-color(${ vars.get('link-color') }, $link-shade-percentage)`);
	vars.set('link-hover-decoration', '');

	//$stretched-link-pseudo-element:           after !default;
	//$stretched-link-z-index:                  1 !default;

	//// Icon links
	//// scss-docs-start icon-link-variables
	//$icon-link-gap:               .375rem !default;
	//$icon-link-underline-offset:  .25em !default;
	//$icon-link-icon-size:         1em !default;
	//$icon-link-icon-transition:   .2s ease-in-out transform !default;
	//$icon-link-icon-transform:    translate3d(.25em, 0, 0) !default;
	//// scss-docs-end icon-link-variables

	//// Paragraphs
	////
	//// Style p element.

	//$paragraph-margin-bottom:   1rem !default;
	//#endregion links


	//#region components
	// Define common padding and border radius sizes and more.

	//// scss-docs-start border-variables
	//$border-width:                1px !default;
	//$border-widths: (
	//1: 1px,
	//2: 2px,
	//3: 3px,
	//4: 4px,
	//5: 5px
	//) !default;
	//$border-style:                solid !default;
	//$border-color:                $gray-300 !default;
	//$border-color-translucent:    rgba($black, .175) !default;
	//// scss-docs-end border-variables

	//// scss-docs-start border-radius-variables
	//$border-radius:               .375rem !default;
	//$border-radius-sm:            .25rem !default;
	//$border-radius-lg:            .5rem !default;
	//$border-radius-xl:            1rem !default;
	//$border-radius-xxl:           2rem !default;
	//$border-radius-pill:          50rem !default;
	//// scss-docs-end border-radius-variables
	//// fusv-disable
	//$border-radius-2xl:           $border-radius-xxl !default; // Deprecated in v5.3.0
	//// fusv-enable

	//// scss-docs-start box-shadow-variables
	//$box-shadow:                  0 .5rem 1rem rgba($black, .15) !default;
	//$box-shadow-sm:               0 .125rem .25rem rgba($black, .075) !default;
	//$box-shadow-lg:               0 1rem 3rem rgba($black, .175) !default;
	//$box-shadow-inset:            inset 0 1px 2px rgba($black, .075) !default;
	//// scss-docs-end box-shadow-variables

	//$component-active-color:      $white !default;
	vars.set('component-active-bg', vars.get('primary'));

	//// scss-docs-start focus-ring-variables
	vars.set('focus-ring-width',      '.25rem');
	vars.set('focus-ring-opacity',    '.25');
	vars.set('focus-ring-color',      `rgba(${ vars.get('primary') }, ${ vars.get('focus-ring-opacity') })`);
	vars.set('focus-ring-blur',       '0');
	vars.set('focus-ring-box-shadow', '0 0 $focus-ring-blur $focus-ring-width $focus-ring-color');
	//// scss-docs-end focus-ring-variables

	//// scss-docs-start caret-variables
	//$caret-width:                 .3em !default;
	//$caret-vertical-align:        $caret-width * .85 !default;
	//$caret-spacing:               $caret-width * .85 !default;
	//// scss-docs-end caret-variables

	//$transition-base:             all .2s ease-in-out !default;
	//$transition-fade:             opacity .15s linear !default;
	//// scss-docs-start collapse-transition
	//$transition-collapse:         height .35s ease !default;
	//$transition-collapse-width:   width .35s ease !default;
	//// scss-docs-end collapse-transition

	//// stylelint-disable function-disallowed-list
	//// scss-docs-start aspect-ratios
	//$aspect-ratios: (
	//"1x1": 100%,
	//"4x3": calc(3 / 4 * 100%),
	//"16x9": calc(9 / 16 * 100%),
	//"21x9": calc(9 / 21 * 100%)
	//) !default;
	//// scss-docs-end aspect-ratios
	//#endregion components


	//#region typography
	// Font, line-height, and color for body text, headings, and more.

	//#region font-variables
	vars.set('font-family-sans-serif', 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", "Liberation Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"');
	vars.set('font-family-monospace', 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace');
	vars.set('font-family-base', `var(--${ prefix }font-sans-serif)`);
	vars.set('font-family-code', `var(--${ prefix }font-monospace)`);

	// $font-size-root affects the value of `rem`, which is used for as well font sizes, paddings, and margins
	// $font-size-base affects the font size of the body text
	vars.set('font-size-root', '');
	vars.set('font-size-base', '1rem'); // Assumes the browser default, typically `16px`
	vars.set('font-size-sm',   '' + vars.getNumber('font-size-base') * .875);
	vars.set('font-size-lg',   '' + vars.getNumber('font-size-base') * 1.25);

	vars.set('font-weight-lighter',  'lighter');
	vars.set('font-weight-light',    '300');
	vars.set('font-weight-normal',   '400');
	vars.set('font-weight-medium',   '500');
	vars.set('font-weight-semibold', '600');
	vars.set('font-weight-bold',     '700');
	vars.set('font-weight-bolder',   'bolder');

	vars.set('font-weight-base', vars.get('font-weight-normal'));

	vars.set('line-height-base', '1.5');
	vars.set('line-height-sm',   '1.25');
	vars.set('line-height-lg',   '2');

	vars.set('h1-font-size', '' + vars.getNumber('font-size-base') * 2.5);
	vars.set('h2-font-size', '' + vars.getNumber('font-size-base') * 2);
	vars.set('h3-font-size', '' + vars.getNumber('font-size-base') * 1.75);
	vars.set('h4-font-size', '' + vars.getNumber('font-size-base') * 1.5);
	vars.set('h5-font-size', '' + vars.getNumber('font-size-base') * 1.25);
	vars.set('h6-font-size', '' + vars.getNumber('font-size-base'));
	//#endregion font-variables


	//// scss-docs-start font-sizes
	//$font-sizes: (
	//1: $h1-font-size,
	//2: $h2-font-size,
	//3: $h3-font-size,
	//4: $h4-font-size,
	//5: $h5-font-size,
	//6: $h6-font-size
	//) !default;
	//// scss-docs-end font-sizes

	//// scss-docs-start headings-variables
	//$headings-margin-bottom:      $spacer * .5 !default;
	//$headings-font-family:        null !default;
	//$headings-font-style:         null !default;
	//$headings-font-weight:        500 !default;
	//$headings-line-height:        1.2 !default;
	//$headings-color:              inherit !default;
	//// scss-docs-end headings-variables

	//// scss-docs-start display-headings
	//$display-font-sizes: (
	//1: 5rem,
	//2: 4.5rem,
	//3: 4rem,
	//4: 3.5rem,
	//5: 3rem,
	//6: 2.5rem
	//) !default;

	//$display-font-family: null !default;
	//$display-font-style:  null !default;
	//$display-font-weight: 300 !default;
	//$display-line-height: $headings-line-height !default;
	//// scss-docs-end display-headings

	//// scss-docs-start type-variables
	//$lead-font-size:              $font-size-base * 1.25 !default;
	//$lead-font-weight:            300 !default;

	//$small-font-size:             .875em !default;

	//$sub-sup-font-size:           .75em !default;

	//// fusv-disable
	//$text-muted:                  var(--#{$prefix}secondary-color) !default; // Deprecated in 5.3.0
	//// fusv-enable

	//$initialism-font-size:        $small-font-size !default;

	//$blockquote-margin-y:         $spacer !default;
	//$blockquote-font-size:        $font-size-base * 1.25 !default;
	//$blockquote-footer-color:     $gray-600 !default;
	//$blockquote-footer-font-size: $small-font-size !default;

	//$hr-margin-y:                 $spacer !default;
	//$hr-color:                    inherit !default;

	//// fusv-disable
	//$hr-bg-color:                 null !default; // Deprecated in v5.2.0
	//$hr-height:                   null !default; // Deprecated in v5.2.0
	//// fusv-enable

	//$hr-border-color:             null !default; // Allows for inherited colors
	//$hr-border-width:             var(--#{$prefix}border-width) !default;
	//$hr-opacity:                  .25 !default;

	//// scss-docs-start vr-variables
	//$vr-border-width:             var(--#{$prefix}border-width) !default;
	//// scss-docs-end vr-variables

	//$legend-margin-bottom:        .5rem !default;
	//$legend-font-size:            1.5rem !default;
	//$legend-font-weight:          null !default;

	//$dt-font-weight:              $font-weight-bold !default;

	//$list-inline-padding:         .5rem !default;

	//$mark-padding:                .1875em !default;
	//$mark-color:                  $body-color !default;
	//$mark-bg:                     $yellow-100 !default;
	//// scss-docs-end type-variables
	//#endregion typography


	//#region buttons + forms
	// shared variables that are reassigned to `$input-` and `$btn-` specific variables.

	//#region input-btn-variables
	vars.set('input-btn-padding-y',           '.375rem');
	vars.set('input-btn-padding-x',           '.75rem');
	vars.set('input-btn-font-family',         '');
	vars.set('input-btn-font-size',           vars.get('font-size-base'));
	vars.set('input-btn-line-height',         vars.get('line-height-base'));
	vars.set('input-btn-focus-width',         vars.get('focus-ring-width'));
	vars.set('input-btn-focus-color-opacity', vars.get('focus-ring-opacity'));
	vars.set('input-btn-focus-color',         vars.get('focus-ring-color'));
	vars.set('input-btn-focus-blur',          vars.get('focus-ring-blur'));
	vars.set('input-btn-focus-box-shadow',    vars.get('focus-ring-box-shadow'));
	vars.set('input-btn-padding-y-sm',        '.25rem');
	vars.set('input-btn-padding-x-sm',        '.5rem');
	vars.set('input-btn-font-size-sm',        vars.get('font-size-sm'));
	vars.set('input-btn-padding-y-lg',        '.5rem');
	vars.set('input-btn-padding-x-lg',        '1rem');
	vars.set('input-btn-font-size-lg',        vars.get('font-size-lg'));
	vars.set('input-btn-border-width',        `var(--${ prefix }border-width)`);
	//#endregion input-btn-variables
	//#endregion Buttons + Forms


	//#region buttons
	vars.set('btn-color',       `var(--${ prefix }body-color)`);
	vars.set('btn-padding-y',   vars.get('input-btn-padding-y'));
	vars.set('btn-padding-x',   vars.get('input-btn-padding-x'));
	vars.set('btn-font-family', vars.get('input-btn-font-family'));
	vars.set('btn-font-size',   vars.get('input-btn-font-size'));
	vars.set('btn-line-height', vars.get('input-btn-line-height'));
	vars.set('btn-white-space', ''); // Set to `nowrap` to prevent text wrapping

	vars.set('btn-padding-y-sm', vars.get('input-btn-padding-y-sm'));
	vars.set('btn-padding-x-sm', vars.get('input-btn-padding-x-sm'));
	vars.set('btn-font-size-sm', vars.get('input-btn-font-size-sm'));

	vars.set('btn-padding-y-lg', vars.get('input-btn-padding-y-lg'));
	vars.set('btn-padding-x-lg', vars.get('input-btn-padding-x-lg'));
	vars.set('btn-font-size-lg', vars.get('input-btn-font-size-lg'));

	vars.set('btn-border-width', vars.get('input-btn-border-width'));

	vars.set('btn-font-weight',      vars.get('font-weight-normal'));
	vars.set('btn-box-shadow',       `inset 0 1px 0 rgba(${ vars.get('white') }, .15), 0 1px 1px rgba(${ vars.get('black') }, .075)`);
	vars.set('btn-focus-width',      vars.get('input-btn-focus-width'));
	vars.set('btn-focus-box-shadow', vars.get('input-btn-focus-box-shadow'));
	vars.set('btn-disabled-opacity', '.65');
	vars.set('btn-active-box-shadow', `inset 0 3px 5px rgba(${ vars.get('black') }, .125)`);

	vars.set('btn-link-color',            `var(--${ prefix }link-color)`);
	vars.set('btn-link-hover-color',      `var(--${ prefix }link-hover-color)`);
	vars.set('btn-link-disabled-color',   `${ vars.get('gray-600') }`);
	vars.set('btn-link-focus-shadow-rgb', `to-rgb(mix(color-contrast(${ vars.get('link-color') }), ${ vars.get('link-color') }, 15%))`);

	// Allows for customizing button radius independently from global border radius
	vars.set('btn-border-radius',    `var(--${ prefix }border-radius)`);
	vars.set('btn-border-radius-sm', `var(--${ prefix }border-radius-sm)`);
	vars.set('btn-border-radius-lg', `var(--${ prefix }border-radius-lg)`);

	vars.set('btn-transition', 'color .15s ease-in-out, background-color .15s ease-in-out, border-color .15s ease-in-out, box-shadow .15s ease-in-out !default');

	//$btn-hover-bg-shade-amount:       15% !default;
	//$btn-hover-bg-tint-amount:        15% !default;
	//$btn-hover-border-shade-amount:   20% !default;
	//$btn-hover-border-tint-amount:    10% !default;
	//$btn-active-bg-shade-amount:      20% !default;
	//$btn-active-bg-tint-amount:       20% !default;
	//$btn-active-border-shade-amount:  25% !default;
	//$btn-active-border-tint-amount:   10% !default;
	//#endregion buttons


	//#region form-input-variables
	//$input-padding-y:                       $input-btn-padding-y !default;
	//$input-padding-x:                       $input-btn-padding-x !default;
	//$input-font-family:                     $input-btn-font-family !default;
	//$input-font-size:                       $input-btn-font-size !default;
	//$input-font-weight:                     $font-weight-base !default;
	//$input-line-height:                     $input-btn-line-height !default;

	//$input-padding-y-sm:                    $input-btn-padding-y-sm !default;
	//$input-padding-x-sm:                    $input-btn-padding-x-sm !default;
	//$input-font-size-sm:                    $input-btn-font-size-sm !default;

	//$input-padding-y-lg:                    $input-btn-padding-y-lg !default;
	//$input-padding-x-lg:                    $input-btn-padding-x-lg !default;
	//$input-font-size-lg:                    $input-btn-font-size-lg !default;

	//$input-bg:                              var(--#{$prefix}body-bg) !default;
	//$input-disabled-color:                  null !default;
	//$input-disabled-bg:                     var(--#{$prefix}secondary-bg) !default;
	//$input-disabled-border-color:           null !default;

	//$input-color:                           var(--#{$prefix}body-color) !default;
	//$input-border-color:                    var(--#{$prefix}border-color) !default;
	//$input-border-width:                    $input-btn-border-width !default;
	//$input-box-shadow:                      var(--#{$prefix}box-shadow-inset) !default;

	//$input-border-radius:                   var(--#{$prefix}border-radius) !default;
	//$input-border-radius-sm:                var(--#{$prefix}border-radius-sm) !default;
	//$input-border-radius-lg:                var(--#{$prefix}border-radius-lg) !default;

	//$input-focus-bg:                        $input-bg !default;
	vars.set('input-focus-border-color', tintColor('$component-active-bg', 50));
	//$input-focus-color:                     $input-color !default;
	//$input-focus-width:                     $input-btn-focus-width !default;
	//$input-focus-box-shadow:                $input-btn-focus-box-shadow !default;

	//$input-placeholder-color:               var(--#{$prefix}secondary-color) !default;
	//$input-plaintext-color:                 var(--#{$prefix}body-color) !default;

	//$input-height-border:                   calc(#{$input-border-width} * 2) !default; // stylelint-disable-line function-disallowed-list

	//$input-height-inner:                    add($input-line-height * 1em, $input-padding-y * 2) !default;
	//$input-height-inner-half:               add($input-line-height * .5em, $input-padding-y) !default;
	//$input-height-inner-quarter:            add($input-line-height * .25em, $input-padding-y * .5) !default;

	//$input-height:                          add($input-line-height * 1em, add($input-padding-y * 2, $input-height-border, false)) !default;
	//$input-height-sm:                       add($input-line-height * 1em, add($input-padding-y-sm * 2, $input-height-border, false)) !default;
	//$input-height-lg:                       add($input-line-height * 1em, add($input-padding-y-lg * 2, $input-height-border, false)) !default;

	//$input-transition:                      border-color .15s ease-in-out, box-shadow .15s ease-in-out !default;

	//$form-color-width:                      3rem !default;
	//#endregion form-input-variables


	//#region accordion
	vars.set('accordion-padding-y',                 `1rem`);
	vars.set('accordion-padding-x',                 `1.25rem`);
	vars.set('accordion-color',                     `var(--${ prefix }body-color)`);
	vars.set('accordion-bg',                        `var(--${ prefix }body-bg)`);
	vars.set('accordion-border-width',              `var(--${ prefix }border-width)`);
	vars.set('accordion-border-color',              `var(--${ prefix }border-color)`);
	vars.set('accordion-border-radius',             `var(--${ prefix }border-radius)`);
	vars.set('accordion-inner-border-radius',       `subtract($accordion-border-radius, $accordion-border-width)`);
	vars.set('accordion-body-padding-y',            vars.get('accordion-padding-y'));
	vars.set('accordion-body-padding-x',            vars.get('accordion-padding-x'));
	vars.set('accordion-button-padding-y',          vars.get('accordion-padding-y'));
	vars.set('accordion-button-padding-x',          vars.get('accordion-padding-x'));
	vars.set('accordion-button-color',              `var(--${ prefix }body-color)`);
	vars.set('accordion-button-bg',                 `var(--${ prefix }accordion-bg)`);
	vars.set('accordion-transition',                `${ vars.get('btn-transition') }, border-radius .15s ease`);
	vars.set('accordion-button-active-bg',          `var(--${ prefix }primary-bg-subtle)`);
	vars.set('accordion-button-active-color',       `var(--${ prefix }primary-text-emphasis)`);
	vars.set('accordion-button-focus-border-color', vars.get('input-focus-border-color'));
	vars.set('accordion-button-focus-box-shadow',   vars.get('btn-focus-box-shadow'));
	vars.set('accordion-icon-width',                `1.25rem`);
	vars.set('accordion-icon-color',                vars.get('body-color'));
	vars.set('accordion-icon-active-color',         vars.get('primary-text-emphasis'));
	vars.set('accordion-icon-transition',           `transform .2s ease-in-out`);
	vars.set('accordion-icon-transform',            `rotate(-180deg)`);
	vars.set('accordion-button-icon',               `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='#{$accordion-icon-color}' stroke-linecap='round' stroke-linejoin='round'><path d='m2 5 6 6 6-6'/></svg>")`);
	vars.set('accordion-button-active-icon',        `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='#{$accordion-icon-active-color}' stroke-linecap='round' stroke-linejoin='round'><path d='m2 5 6 6 6-6'/></svg>")`);
	//#endregion accordion

	//console.log(vars);

	return vars;
};


export const style = {} as {
	vars:        StyleProxy;
	themeColors: (string | number)[][];
};
style.vars = createStyleVariables({ prefix: 'bs-' });
style.themeColors = [
	[ 'primary',    style.vars['primary'  ]! ],
	[ 'secondary',  style.vars['secondary']! ],
	[ 'success',    style.vars['success'  ]! ],
	[ 'info',       style.vars['info'     ]! ],
	[ 'warning',    style.vars['warning'  ]! ],
	[ 'danger',     style.vars['danger'   ]! ],
	[ 'light',      style.vars['light'    ]! ],
	[ 'dark',       style.vars['dark'     ]! ],
];


export const styleVariables = { value: style.vars };
