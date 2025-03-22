import { styleVariables } from '../../style-variables.ts';


// Helper function to replace negative values with 0
export const validRadius = (radius: string | number): string => {
	const radiusArray = typeof radius === 'number'
		? [ radius + 'px' ]
		: radius.split(' ');

	for (let i = 0; i < radiusArray.length; i++) {
		const radii = radiusArray[i]!;

		// Make sure any number is positive
		const num = parseFloat(radii);
		radiusArray[i] = radii.replace(/\d/, () => '' + num);
	}

	return radiusArray.join(' ');
};

//@function valid-radius($radius) {
//	$return: ();
//	@each $value in $radius {
//		@if type-of($value) == number {
//			$return: append($return, max($value, 0));
//		} @else {
//			$return: append($return, $value);
//		}
//	}
//	@return $return;
//}


export const borderRadius = (radius: string | number, fallback?: string | number): string => {
	//const radiusValue


	const enableRounded = styleVariables.value.get('enable-rounded');
	if (enableRounded) {
		const value = typeof radius === 'number' ? radius + 'px' : radius;

		return 'border-radius:' + value;
	}

	if (fallback !== undefined) {
		const value = typeof fallback === 'number' ? fallback + 'px' : fallback;

		return 'border-radius:' + value;
	}

	return '';
};
