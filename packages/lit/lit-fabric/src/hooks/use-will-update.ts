import { invariant } from '@roenlie/core/validation';
import type { LitElement, PropertyValues } from 'lit';

import { getCurrentRef } from '../core/component.js';


type UseWillUpdate = (
	func: (changedProps: PropertyValues) => void,
	deps?: string[],
) => void;


export const useWillUpdate = ((
	func: (changedProps: PropertyValues) => void,
	deps?: string[],
) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	cls.__willUpdateHooks.push((props) => {
		if (deps?.some(dep => props.has(dep)) ?? true)
			func(props);
	});
}) satisfies UseWillUpdate;
