import { invariant } from '@roenlie/core/validation';

import { getCurrentRef } from '../core/component.js';


type UseAfterConnected = (
	func: () => void,
) => void;


export const useAfterConnected = ((func: () => void) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	let firstUpdated = true;
	cls.__connectedHooks.push(() => firstUpdated = true);
	cls.__updatedHooks.push(() => {
		firstUpdated && func();
		firstUpdated = false;
	});
}) satisfies UseAfterConnected;
