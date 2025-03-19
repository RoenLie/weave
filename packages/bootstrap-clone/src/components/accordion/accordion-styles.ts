import { css, type CSSStyle } from '@roenlie/custom-element/adapter-element';


export const createAccordionStyles = (options: {
	prefix:    string;
	variables: Record<string, string>;
}): CSSStyle[] => {
	const { prefix, variables } = options;

	return [
		css`
		:host {
			--${ prefix }accordion-color:                ${ variables['accordion-color'] };
			--${ prefix }accordion-bg:                   ${ variables['accordion-bg'] };
			--${ prefix }accordion-transition:           ${ variables['accordion-transition'] };
			--${ prefix }accordion-border-color:         ${ variables['accordion-border-color'] };
			--${ prefix }accordion-border-width:         ${ variables['accordion-border-width'] };
			--${ prefix }accordion-border-radius:        ${ variables['accordion-border-radius'] };
			--${ prefix }accordion-inner-border-radius:  ${ variables['accordion-inner-border-radius'] };
			--${ prefix }accordion-btn-padding-x:        ${ variables['accordion-button-padding-x'] };
			--${ prefix }accordion-btn-padding-y:        ${ variables['accordion-button-padding-y'] };
			--${ prefix }accordion-btn-color:            ${ variables['accordion-button-color'] };
			--${ prefix }accordion-btn-bg:               ${ variables['accordion-button-bg'] };
			--${ prefix }accordion-btn-icon:             ${ variables['accordion-button-icon'] };
			--${ prefix }accordion-btn-icon-width:       ${ variables['accordion-icon-width'] };
			--${ prefix }accordion-btn-icon-transform:   ${ variables['accordion-icon-transform'] };
			--${ prefix }accordion-btn-icon-transition:  ${ variables['accordion-icon-transition'] };
			--${ prefix }accordion-btn-active-icon:      ${ variables['accordion-button-active-icon'] };
			--${ prefix }accordion-btn-focus-box-shadow: ${ variables['accordion-button-focus-box-shadow'] };
			--${ prefix }accordion-body-padding-x:       ${ variables['accordion-body-padding-x'] };
			--${ prefix }accordion-body-padding-y:       ${ variables['accordion-body-padding-y'] };
			--${ prefix }accordion-active-color:         ${ variables['accordion-button-active-color'] };
			--${ prefix }accordion-active-bg:            ${ variables['accordion-button-active-bg'] };
		}
	`,
	];
};
