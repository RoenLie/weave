import { unsafeCSS } from 'lit';


/** @internalexport */
export const joinSelectors = (selectors: string[], psuedoclass?: string) =>
	unsafeCSS(selectors.join((psuedoclass ?? '') + ',') + (psuedoclass ?? ''));
