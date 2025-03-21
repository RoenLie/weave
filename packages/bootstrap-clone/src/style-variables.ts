import { shadeColor, tintColor } from './styles/functions.ts';

export const createStyleVariables = (options: {
	prefix: string;
}): Map<string, string> => {
	const { prefix } = options;

	class StrictMap<K, V> extends Map<K, NonNullable<V>> {

		override get(key: K): NonNullable<V> {
			const value = super.get(key);
			if (value === undefined)
				throw new Error(`Variable "${ key }" is not defined.`);

			return value as NonNullable<V>;
		}

	}

	const vars = new StrictMap<string, string | undefined>();

	//#region gray-color-variables
	vars.set('white',    '#fff');
	vars.set('gray-100', '#f8f9fa');
	vars.set('gray-200', '#e9ecef');
	vars.set('gray-300', '#dee2e6');
	vars.set('gray-400', '#ced4da');
	vars.set('gray-500', '#adb5bd');
	vars.set('gray-600', '#6c757d');
	vars.set('gray-700', '#495057');
	vars.set('gray-800', '#343a40');
	vars.set('gray-900', '#212529');
	vars.set('black',    '#000');
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


	// scss-docs-start theme-text-variables
	vars.set('primary-text-emphasis',   shadeColor(vars.get('primary'),   60));
	vars.set('secondary-text-emphasis', shadeColor(vars.get('secondary'), 60));
	vars.set('success-text-emphasis',   shadeColor(vars.get('success'),   60));
	vars.set('info-text-emphasis',      shadeColor(vars.get('info'),      60));
	vars.set('warning-text-emphasis',   shadeColor(vars.get('warning'),   60));
	vars.set('danger-text-emphasis',    shadeColor(vars.get('danger'),    60));
	vars.set('light-text-emphasis',     vars.get('gray-700'));
	vars.set('dark-text-emphasis',      vars.get('gray-700'));
	// scss-docs-end theme-text-variables


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


	//#region buttons + forms
	// shared variables that are reassigned to `$input-` and `$btn-` specific variables.

	// scss-docs-start input-btn-variables
	vars.set('input-btn-padding-y',           '.375rem');
	vars.set('input-btn-padding-x',           '.75rem');
	vars.set('input-btn-font-family',         '');
	vars.set('input-btn-font-size',           '$font-size-base');
	vars.set('input-btn-line-height',         '$line-height-base');
	vars.set('input-btn-focus-width',         '$focus-ring-width');
	vars.set('input-btn-focus-color-opacity', '$focus-ring-opacity');
	vars.set('input-btn-focus-color',         '$focus-ring-color');
	vars.set('input-btn-focus-blur',          '$focus-ring-blur');
	vars.set('input-btn-focus-box-shadow',    '$focus-ring-box-shadow');
	vars.set('input-btn-padding-y-sm',        '.25rem');
	vars.set('input-btn-padding-x-sm',        '.5rem');
	vars.set('input-btn-font-size-sm',        '$font-size-sm');
	vars.set('input-btn-padding-y-lg',        '.5rem');
	vars.set('input-btn-padding-x-lg',        '1rem');
	vars.set('input-btn-font-size-lg',        '$font-size-lg');
	vars.set('input-btn-border-width',        'var(--#{$prefix}border-width)');
	// scss-docs-end input-btn-variables
	//#endregion Buttons + Forms


	//#region buttons
	//$btn-color:                   var(--#{$prefix}body-color) !default;
	//$btn-padding-y:               $input-btn-padding-y !default;
	//$btn-padding-x:               $input-btn-padding-x !default;
	//$btn-font-family:             $input-btn-font-family !default;
	//$btn-font-size:               $input-btn-font-size !default;
	//$btn-line-height:             $input-btn-line-height !default;
	//$btn-white-space:             null !default; // Set to `nowrap` to prevent text wrapping

	//$btn-padding-y-sm:            $input-btn-padding-y-sm !default;
	//$btn-padding-x-sm:            $input-btn-padding-x-sm !default;
	//$btn-font-size-sm:            $input-btn-font-size-sm !default;

	//$btn-padding-y-lg:            $input-btn-padding-y-lg !default;
	//$btn-padding-x-lg:            $input-btn-padding-x-lg !default;
	//$btn-font-size-lg:            $input-btn-font-size-lg !default;

	//$btn-border-width:            $input-btn-border-width !default;

	//$btn-font-weight:             $font-weight-normal !default;
	//$btn-box-shadow:              inset 0 1px 0 rgba($white, .15), 0 1px 1px rgba($black, .075) !default;
	//$btn-focus-width:             $input-btn-focus-width !default;
	vars.set('btn-focus-box-shadow', '$input-btn-focus-box-shadow');
	//$btn-disabled-opacity:        .65 !default;
	//$btn-active-box-shadow:       inset 0 3px 5px rgba($black, .125) !default;

	//$btn-link-color:              var(--#{$prefix}link-color) !default;
	//$btn-link-hover-color:        var(--#{$prefix}link-hover-color) !default;
	//$btn-link-disabled-color:     $gray-600 !default;
	//$btn-link-focus-shadow-rgb:   to-rgb(mix(color-contrast($link-color), $link-color, 15%)) !default;

	//// Allows for customizing button radius independently from global border radius
	//$btn-border-radius:           var(--#{$prefix}border-radius) !default;
	//$btn-border-radius-sm:        var(--#{$prefix}border-radius-sm) !default;
	//$btn-border-radius-lg:        var(--#{$prefix}border-radius-lg) !default;

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


	// Accordion
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

	//const vars = { ...accordianVars };

	//for (const key of Object.keys(vars)) {
	//	vars[key] = vars[key]!.replace(
	//		/\$([a-z]+)/g,
	//		(match, name) => vars[name] ?? vars[key]!,
	//	);
	//}

	console.log(vars);

	return vars;
};


export const styleVariables = createStyleVariables({ prefix: 'bs-' });
