import { ReactiveSignalControllerHost } from './controller-host.ts';


/**
 * A custom element that can host reactive controllers,
 * and is augmented with lifecycle hooks as well as signal reactivity.
 */
export class CustomElement extends ReactiveSignalControllerHost {}
