import { invariant } from '@roenlie/core/validation';
import type { PropertyValues } from 'lit';

import { getCurrentRef } from '../core/component.js';


type UseUpdated = (
	func: (changedProps: PropertyValues) => void,
	deps?: string[],
) => void;


export const useUpdated = ((
	func: (changedProps: PropertyValues) => void,
	deps?: string[],
) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	cls.__updatedHooks.push((props) => {
		if (deps?.some(dep => props.has(dep)) ?? true)
			func(props);
	});
}) satisfies UseUpdated;
