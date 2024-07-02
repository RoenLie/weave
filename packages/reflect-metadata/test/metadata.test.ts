import { expect, suite, test } from 'vitest';

import { ReflectMetadata } from '../src/reflect-metadata.js';


suite('Reflect.metadata', () => {
	test('ReturnsDecoratorFunction', () => {
		const result = ReflectMetadata.metadata('key', 'value');

		expect(typeof result).to.be.equal('function');
	});

	test('OnTargetWithoutTargetKey', () => {
		const decorator = ReflectMetadata.metadata('key', 'value');
		const target = function() {};
		decorator(target);

		const result = ReflectMetadata.hasOwnMetadata('key', target, undefined!);

		expect(result).to.be.equal(true);
	});

	test('OnTargetWithTargetKey', () => {
		const decorator = ReflectMetadata.metadata('key', 'value');
		const target = {};
		decorator(target, 'name');

		const result = ReflectMetadata.hasOwnMetadata('key', target, 'name');

		expect(result).to.be.equal(true);
	});
});
