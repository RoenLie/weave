import { getDefaultAnimation } from '@roenlie/core/animation';


export const routeAnimation = () => {
	return {
		show: getDefaultAnimation('route.show'),
		hide: getDefaultAnimation('route.hide'),
	};
};
