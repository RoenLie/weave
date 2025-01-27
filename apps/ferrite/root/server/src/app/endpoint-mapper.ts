import type { RequestHandler, Express } from 'express';
import { glob } from 'node:fs/promises';

import { app } from './main.js';
import { basename, join, resolve } from 'path';
import { Endpoint } from './endpoint.js';


const registerCache: Set<string> = new Set();
const patternCache: Set<string> = new Set();


export interface ControllerMethod {
	order:    number;
	path:     string;
	method:   Extract<keyof Express, 'get' | 'put' | 'post' | 'patch' | 'delete'>;
	handlers: RequestHandler[];
}


export type ExpressController = (ControllerMethod | (new () => Endpoint))[];

const requiredKeys = new Set([ 'order', 'path', 'method', 'handlers' ]);
const isControllerMethod = (obj: any): obj is ControllerMethod => {
	if (typeof obj !== 'object')
		return false;

	const keys = new Set(Object.keys(obj));
	if (keys.size !== 4)
		return false;

	if (keys.isSupersetOf(requiredKeys))
		return true;

	return false;
};


const endpointPromises: Promise<ExpressController>[] = [];


export const mapEndpoints = async (
	/** Glob pattern for finding the controllers you want to automatically register. */
	pattern: string,
) => {
	// We only register controllers from a directory subtree once.
	if (patternCache.has(pattern))
		return;

	patternCache.add(pattern);

	const filePaths: string[] = [];
	const pathGlob = glob(pattern);
	for await (const path of pathGlob)
		filePaths.push(path);

	const filesToRegister = filePaths
		.map(path => 'file:' + join(resolve(), path).replaceAll('\\', '/'))
		.filter(path => {
			const isController = basename(path).endsWith('controller.ts');
			if (isController && !registerCache.has(path))
				return !!registerCache.add(path);
		});

	endpointPromises.push(...filesToRegister
		.map(async path => await import(path).then(m => m.default)));
};


export const isClass = (obj: any): obj is new () => Endpoint => {
	if (typeof obj !== 'function')
		return false;

	const descriptor = Object.getOwnPropertyDescriptor(obj, 'prototype');
	if (!descriptor)
		return false;

	return !descriptor.writable;
};


export const registerEndpoints = async () => {
	const imports: ExpressController[] = await Promise.all(endpointPromises);

	const methods = imports.flatMap(methods => methods
		.map(m => isClass(m) ? (new m()).toHandler() : m))
		.filter(m => isControllerMethod(m));

	// Sort the endpoints by segment count.
	// paths ending in * will have lower priority within their segment count.
	// This should ensure that more spesific endpoints
	// have higher priority.
	methods.sort((a, b) => {
		let aPathSegments = a.path.split('/').length;
		let bPathSegments = b.path.split('/').length;

		if (aPathSegments === bPathSegments) {
			if (a.path.endsWith('*'))
				aPathSegments -= 1;
			if (b.path.endsWith('*'))
				bPathSegments -= 1;
		}

		return bPathSegments - aPathSegments;
	});

	for (const method of methods)
		app[method.method](method.path, method.handlers);
};
