import { expect, suite, test } from 'vitest';

import { ReflectMetadata } from '../src/reflect-metadata.js';


suite('Reflect.hasMetadata', () => {
	test('without target key when not defined', () => {
		const obj = {};
		const result = ReflectMetadata.hasMetadata('key', obj, undefined!);

		expect(result).to.be.equal(false);
	});

	test('without target key when defined', () => {
		const obj = {};
		ReflectMetadata.defineMetadata('key', 'value', obj, undefined!);
		const result = ReflectMetadata.hasMetadata('key', obj, undefined!);

		expect(result).to.be.equal(true);
	});

	test('without target key when defined on prototype', () => {
		const prototype = {};
		const obj = Object.create(prototype);
		ReflectMetadata.defineMetadata('key', 'value', prototype, undefined!);
		const result = ReflectMetadata.hasMetadata('key', obj, undefined!);

		expect(result).to.be.equal(true);
	});

	test('with target key when not defined', () => {
		const obj = {};
		const result = ReflectMetadata.hasMetadata('key', obj, 'name');

		expect(result).to.be.equal(false);
	});

	test('with target key when defined', () => {
		const obj = {};
		ReflectMetadata.defineMetadata('key', 'value', obj, 'name');
		const result = ReflectMetadata.hasMetadata('key', obj, 'name');

		expect(result).to.be.equal(true);
	});

	test('with target key when defined on prototype', () => {
		const prototype = {};
		const obj = Object.create(prototype);
		ReflectMetadata.defineMetadata('key', 'value', prototype, 'name');
		const result = ReflectMetadata.hasMetadata('key', obj, 'name');

		expect(result).to.be.equal(true);
	});
});
