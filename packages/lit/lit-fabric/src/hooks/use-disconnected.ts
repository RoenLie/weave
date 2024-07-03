import { invariant } from '@roenlie/core/validation';
import type { LitElement } from 'lit';

import { getCurrentRef } from '../core/component.js';


type UseDisconnected = (
	func: () => void,
) => void;


export const useDisconnected = ((func: () => void) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	cls.__disconnectedHooks.push(func);
}) satisfies UseDisconnected;
