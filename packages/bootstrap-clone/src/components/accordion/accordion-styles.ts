import { css, type CSSStyle } from '@roenlie/custom-element/adapter-element';

import { transition } from '../../styles/mixins/transition-mixin.ts';


export const createAccordionStyles = (options: {
	prefix:    string;
	variables: Map<string, string>;
}): CSSStyle[] => {
	const { prefix, variables } = options;

	return [
		css`
		:host {
			--${ prefix }accordion-color:                ${ variables.get('accordion-color') };
			--${ prefix }accordion-bg:                   ${ variables.get('accordion-bg') };
			--${ prefix }accordion-transition:           ${ variables.get('accordion-transition') };
			--${ prefix }accordion-border-color:         ${ variables.get('accordion-border-color') };
			--${ prefix }accordion-border-width:         ${ variables.get('accordion-border-width') };
			--${ prefix }accordion-border-radius:        ${ variables.get('accordion-border-radius') };
			--${ prefix }accordion-inner-border-radius:  ${ variables.get('accordion-inner-border-radius') };
			--${ prefix }accordion-btn-padding-x:        ${ variables.get('accordion-button-padding-x') };
			--${ prefix }accordion-btn-padding-y:        ${ variables.get('accordion-button-padding-y') };
			--${ prefix }accordion-btn-color:            ${ variables.get('accordion-button-color') };
			--${ prefix }accordion-btn-bg:               ${ variables.get('accordion-button-bg') };
			--${ prefix }accordion-btn-icon:             ${ variables.get('accordion-button-icon') };
			--${ prefix }accordion-btn-icon-width:       ${ variables.get('accordion-icon-width') };
			--${ prefix }accordion-btn-icon-transform:   ${ variables.get('accordion-icon-transform') };
			--${ prefix }accordion-btn-icon-transition:  ${ variables.get('accordion-icon-transition') };
			--${ prefix }accordion-btn-active-icon:      ${ variables.get('accordion-button-active-icon') };
			--${ prefix }accordion-btn-focus-box-shadow: ${ variables.get('accordion-button-focus-box-shadow') };
			--${ prefix }accordion-body-padding-x:       ${ variables.get('accordion-body-padding-x') };
			--${ prefix }accordion-body-padding-y:       ${ variables.get('accordion-body-padding-y') };
			--${ prefix }accordion-active-color:         ${ variables.get('accordion-button-active-color') };
			--${ prefix }accordion-active-bg:            ${ variables.get('accordion-button-active-bg') };
		}
		`,
		css`
		.accordion-button {
			position: relative;
			display: flex;
			align-items: center;
			width: 100%;
			padding: var(--${ prefix }accordion-btn-padding-y) var(--${ prefix }accordion-btn-padding-x);
			/*@include font-size($font-size-base);*/
			color: var(--${ prefix }accordion-btn-color);
			text-align: left; // Reset button style
			background-color: var(--${ prefix }accordion-btn-bg);
			border: 0;
			/*@include border-radius(0);*/
			overflow-anchor: none;

			/*\${ transition() }*/

			/*@include transition(var(--\${ prefix }accordion-transition));*/

			&:not(.collapsed) {
				color: var(--${ prefix }accordion-active-color);
				background-color: var(--${ prefix }accordion-active-bg);
				box-shadow: inset
					0 calc(-1 * var(--${ prefix }accordion-border-width))
					0 var(--${ prefix }accordion-border-color);

				&::after {
					background-image: var(--${ prefix }accordion-btn-active-icon);
					transform: var(--${ prefix }accordion-btn-icon-transform);
				}
			}

			// Accordion icon
			&::after {
				flex-shrink: 0;
				width: var(--${ prefix }accordion-btn-icon-width);
				height: var(--${ prefix }accordion-btn-icon-width);
				margin-left: auto;
				content: "";
				background-image: var(--${ prefix }accordion-btn-icon);
				background-repeat: no-repeat;
				background-size: var(--${ prefix }accordion-btn-icon-width);
				/*@include transition(var(--\${ prefix }accordion-btn-icon-transition));*/
			}

			&:hover {
				z-index: 2;
			}

			&:focus {
				z-index: 3;
				outline: 0;
				box-shadow: var(--${ prefix }accordion-btn-focus-box-shadow);
			}
		}
		`,
	];
};
