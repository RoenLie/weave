import type { ReactiveControllerHost } from 'lit';


/** @internalexport */
export interface LitHost extends ReactiveControllerHost, Record<string, any> {}
