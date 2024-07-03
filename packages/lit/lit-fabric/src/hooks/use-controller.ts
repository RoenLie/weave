import { invariant } from '@roenlie/core/validation';
import type { LitElement, ReactiveController } from 'lit';

import { component, getCurrentRef } from '../core/component.js';
import { Getter } from '../utilities/getter.js';


type UseController = <T extends ReactiveController = ReactiveController>(
	controller: T,
) => T;


export const useController = (<T extends ReactiveController>(
	controller: ((element: LitElement) => T) | T,
) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	const ctrl = typeof controller === 'function'
		? controller(cls)
		: controller;

	cls.addController(ctrl);

	return ctrl;
}) satisfies UseController;
