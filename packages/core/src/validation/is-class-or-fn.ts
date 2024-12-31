import type { Ctor } from '../types/class.types.js';
import type { Fn } from '../types/function.types.js';


export const isClass = (obj: any): obj is Ctor => {
	// if not a function, return false.
	if (typeof obj !== 'function')
		return false;

	// is a function, has a `prototype`, and can't be deleted!

	// although a function's prototype is writable (can be reassigned),
	//   it's not configurable (can't update property flags), so it
	//   will remain writable.
	//
	// a class's prototype is non-writable.
	//
	// Table: property flags of function/class prototype
	// ---------------------------------
	//   prototype  write  enum  config
	// ---------------------------------
	//   function     v      .      .
	//   class        .      .      .
	// ---------------------------------
	const descriptor = Object.getOwnPropertyDescriptor(obj, 'prototype');

	// functions like `Promise.resolve` do have NO `prototype`.
	//   (I have no idea why this is happening, sorry.)
	if (!descriptor)
		return false;

	return !descriptor.writable;
};


/**
 * Asserts that the value is a `function`.
 */
export const isFunction = (maybeFunction: any): maybeFunction is Fn => {
	const isBaselineFunction = typeof maybeFunction === 'function';
	if (!isBaselineFunction)
		return false;

	return !isClass(maybeFunction);
};
