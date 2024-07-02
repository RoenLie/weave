import { expect, suite, test } from 'vitest';

import { ReflectMetadata } from '../src/reflect-metadata.js';


suite('Reflect.decorate', () => {
	test('executes decorators in reverse order for function overload', () => {
		const order: number[] = [];
		const decorators = [
			(_target: Function): void => { order.push(0); },
			(_target: Function): void => { order.push(1); },
		];
		const target = function() { };
		ReflectMetadata.decorate(decorators, target);

		expect(order).to.be.deep.equal([ 1, 0 ]);
	});

	test('executes decorators in reverse order for property overload', () => {
		const order: number[] = [];
		const decorators = [
			(_target: object, _name: string | symbol): void => { order.push(0); },
			(_target: object, _name: string | symbol): void => { order.push(1); },
		];
		const target = {};
		const name = 'name';
		ReflectMetadata.decorate(decorators, target, name, undefined);

		expect(order).to.be.deep.equal([ 1, 0 ]);
	});

	test('executes decorators in reverse order for property descriptor overload', () => {
		const order: number[] = [];
		const decorators = [
			(_target: object, _name: string | symbol): void => { order.push(0); },
			(_target: object, _name: string | symbol): void => { order.push(1); },
		];
		const target = {};
		const name = 'name';
		const descriptor = {};
		ReflectMetadata.decorate(decorators, target, name, descriptor);

		expect(order).to.be.deep.equal([ 1, 0 ]);
	});

	test('decorator pipeline for function overload', () => {
		const A = function A(): void { };
		const B = function B(): void { };
		const decorators = [
			(_target: Function): any => { return undefined; },
			(_target: Function): any => { return A; },
			(_target: Function): any => { return B; },
		];
		const target = function(): void { };
		const result = ReflectMetadata.decorate(decorators, target);

		expect(result).toStrictEqual(A);
	});

	test('decorator pipeline for property overload', () => {
		const A = {};
		const B = {};
		const decorators = [
			(_target: object, _name: string | symbol): any => { return undefined; },
			(_target: object, _name: string | symbol): any => { return A; },
			(_target: object, _name: string | symbol): any => { return B; },
		];
		const target = {};
		const result = ReflectMetadata.decorate(decorators, target, 'name', undefined);

		expect(result).toStrictEqual(A);
	});

	test('decorator pipeline for property descriptor overload', () => {
		const A = {};
		const B = {};
		const C = {};
		const decorators = [
			(_target: object, _name: string | symbol): any => { return undefined; },
			(_target: object, _name: string | symbol): any => { return A; },
			(_target: object, _name: string | symbol): any => { return B; },
		];
		const target = {};
		const result = ReflectMetadata.decorate(decorators, target, 'name', C);

		expect(result).toStrictEqual(A);
	});

	test('decorator correct target in pipeline for function overload', () => {
		const sent: Function[] = [];
		const A = function A(): void { };
		const B = function B(): void { };
		const decorators = [
			(target: Function): any => {
				sent.push(target);

				return undefined;
			},
			(target: Function): any => {
				sent.push(target);

				return undefined;
			},
			(target: Function): any => {
				sent.push(target);

				return A;
			},
			(target: Function): any => {
				sent.push(target);

				return B;
			},
		];
		const target = function(): void { };
		ReflectMetadata.decorate(decorators, target);

		expect(sent).to.be.deep.equal([ target, B, A, A ]);
	});

	test('decorator correct target in pipeline for property overload', () => {
		const sent: object[] = [];
		const decorators = [
			(target: object, _name: string | symbol): any => { sent.push(target); },
			(target: object, _name: string | symbol): any => { sent.push(target); },
			(target: object, _name: string | symbol): any => { sent.push(target); },
			(target: object, _name: string | symbol): any => { sent.push(target); },
		];
		const target = { };
		ReflectMetadata.decorate(decorators, target, 'name');

		expect(sent).to.be.deep.equal([ target, target, target, target ]);
	});

	test('decorator correct name in pipeline for property overload', () => {
		const sent: (symbol | string)[] = [];
		const decorators = [
			(_target: object, name: string | symbol): any => { sent.push(name); },
			(_target: object, name: string | symbol): any => { sent.push(name); },
			(_target: object, name: string | symbol): any => { sent.push(name); },
			(_target: object, name: string | symbol): any => { sent.push(name); },
		];
		const target = { };
		ReflectMetadata.decorate(decorators, target, 'name');

		expect(sent).to.be.deep.equal([ 'name', 'name', 'name', 'name' ]);
	});

	test('decorator correct target in pipeline for property descriptor overload', () => {
		const sent: object[] = [];
		const A = { };
		const B = { };
		const C = { };
		const decorators = [
			(target: object, _name: string | symbol): any => {
				sent.push(target);

				return undefined;
			},
			(target: object, _name: string | symbol): any => {
				sent.push(target);

				return undefined;
			},
			(target: object, _name: string | symbol): any => {
				sent.push(target);

				return A;
			},
			(target: object, _name: string | symbol): any => {
				sent.push(target);

				return B;
			},
		];
		const target = { };
		ReflectMetadata.decorate(decorators, target, 'name', C);

		expect(sent).to.be.deep.equal([ target, target, target, target ]);
	});

	test('decorator correct name in pipeline for property descriptor overload', () => {
		const sent: (symbol | string)[] = [];
		const A = { };
		const B = { };
		const C = { };
		const decorators = [
			(_target: object, name: string | symbol): any => {
				sent.push(name);

				return undefined;
			},
			(_target: object, name: string | symbol): any => {
				sent.push(name);

				return undefined;
			},
			(_target: object, name: string | symbol): any => {
				sent.push(name);

				return A;
			},
			(_target: object, name: string | symbol): any => {
				sent.push(name);

				return B;
			},
		];
		const target = { };
		ReflectMetadata.decorate(decorators, target, 'name', C);

		expect(sent).to.be.deep.equal([ 'name', 'name', 'name', 'name' ]);
	});

	test('decorator correct descriptor in pipeline for property descriptor overload', () => {
		const sent: PropertyDescriptor[] = [];
		const A = { };
		const B = { };
		const C = { };
		const decorators = [
			(_target: object, _name: string | symbol, descriptor?: PropertyDescriptor): any => {
				sent.push(descriptor!);

				return undefined;
			},
			(_target: object, _name: string | symbol, descriptor?: PropertyDescriptor): any => {
				sent.push(descriptor!);

				return undefined;
			},
			(_target: object, _name: string | symbol, descriptor?: PropertyDescriptor): any => {
				sent.push(descriptor!);

				return A;
			},
			(_target: object, _name: string | symbol, descriptor?: PropertyDescriptor): any => {
				sent.push(descriptor!);

				return B;
			},
		];
		const target = { };
		ReflectMetadata.decorate(decorators, target, 'name', C);

		expect(sent).to.be.deep.equal([ C, B, A, A ]);
	});
});
