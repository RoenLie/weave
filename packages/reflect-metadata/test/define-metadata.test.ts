import { expect, suite, test } from 'vitest';

import { ReflectMetadata } from '../src/reflect-metadata.js';


suite('Reflect.defineMetadata', () => {
	test('valid target without target key', () => {
		const define = () => ReflectMetadata.defineMetadata('key', 'value', { }, undefined!);
		expect(define).not.toThrow();
	});

	test('valid target with target key', () => {
		const define = () => ReflectMetadata.defineMetadata('key', 'value', { }, 'name');
		expect(define).not.toThrow();
	});
});
