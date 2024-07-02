import { expect, suite, test } from 'vitest';

import { ReflectMetadata } from '../src/reflect-metadata.js';


suite('Reflect.getOwnMetadata', () => {
	test('without target key when not defined', () => {
		const obj = {};
		const result = ReflectMetadata.getOwnMetadata('key', obj, undefined!);

		expect(result).to.be.equal(undefined);
	});

	test('without target key when defined', () => {
		const obj = {};
		ReflectMetadata.defineMetadata('key', 'value', obj, undefined!);
		const result = ReflectMetadata.getOwnMetadata('key', obj, undefined!);

		expect(result).to.be.equal('value');
	});

	test('without target key when defined on prototype', () => {
		const prototype = {};
		const obj = Object.create(prototype);
		ReflectMetadata.defineMetadata('key', 'value', prototype, undefined!);

		const result = ReflectMetadata.getOwnMetadata('key', obj, undefined!);
		expect(result).to.be.equal(undefined);
	});

	test('with target key when not defined', () => {
		const obj = {};
		const result = ReflectMetadata.getOwnMetadata('key', obj, 'name');

		expect(result).to.be.equal(undefined);
	});

	test('with target key when defined', () => {
		const obj = {};
		ReflectMetadata.defineMetadata('key', 'value', obj, 'name');
		const result = ReflectMetadata.getOwnMetadata('key', obj, 'name');

		expect(result).to.be.equal('value');
	});

	test('with target key when defined on prototype', () => {
		const prototype = {};
		const obj = Object.create(prototype);
		ReflectMetadata.defineMetadata('key', 'value', prototype, 'name');
		const result = ReflectMetadata.getOwnMetadata('key', obj, 'name');

		expect(result).to.be.equal(undefined);
	});
});
