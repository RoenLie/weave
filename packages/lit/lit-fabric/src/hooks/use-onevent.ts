import { invariant } from '@roenlie/core/validation';
import type { LitElement } from 'lit';

import { getCurrentRef } from '../core/component.js';


type UseOnEvent = (
	eventName: string,
	func: (event: Event, element: LitElement) => any,
) => any;


export const useOnEvent = (<T extends Event>(
	eventName: string,
	func: (event: T, element: LitElement) => any,
) => {
	const cls = getCurrentRef();
	invariant(cls, 'Could not get component instance.');

	const fn = (ev: Event) => func(ev as T, cls);

	cls.__connectedHooks.push(() => {
		cls.addEventListener(eventName, fn);
	});

	cls.__disconnectedHooks.push(() => {
		cls.removeEventListener(eventName, fn);
	});
}) satisfies UseOnEvent;
