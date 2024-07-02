import { nameof } from '@roenlie/mimic-core/function';
import { useReflectMetadata } from '@roenlie/reflect-metadata';
import { type interfaces, METADATA_KEY } from 'inversify';
import type { DecoratorTarget } from 'inversify/lib/annotation/decorator_utils.js';
import * as ERROR_MSGS from 'inversify/lib/constants/error_msgs.js';
import { Metadata } from 'inversify/lib/planning/metadata.js';
import { getFirstArrayDuplicate } from 'inversify/lib/utils/js.js';

useReflectMetadata();


export type Prototype<T> = {
	[Property in keyof T]: T[Property] extends NewableFunction
		? T[Property]
		: T[Property]
		| undefined;
} & {
	constructor: NewableFunction;
	prototype: T
};


const createTaggedDecorator = (
	metadata: interfaces.MetadataOrMetadataArray,
	target: DecoratorTarget,
	targetKey?: string | symbol,
	index?: number,
) => {
	if (typeof index === 'number')
		_tagParameterOrProperty(METADATA_KEY.TAGGED, target, index.toString(), metadata);
	else if (targetKey)
		_tagParameterOrProperty(METADATA_KEY.TAGGED_PROP, target, targetKey, metadata);
};


const _tagParameterOrProperty = (
	metadataKey: string,
	annotationTarget: DecoratorTarget,
	key: string | symbol,
	metadata: interfaces.MetadataOrMetadataArray,
) => {
	const metadatas: interfaces.Metadata[] = _ensureNoMetadataKeyDuplicates(metadata);
	let paramsOrPropertiesMetadata: Record<string | symbol, interfaces.Metadata[] | undefined> = {};

	// read metadata if available
	if (Reflect.hasOwnMetadata(metadataKey, annotationTarget))
		paramsOrPropertiesMetadata = Reflect.getMetadata(metadataKey, annotationTarget) ?? {};

	let paramOrPropertyMetadata = paramsOrPropertiesMetadata[key];
	if (paramOrPropertyMetadata === undefined) {
		paramOrPropertyMetadata = [];
	}
	else {
		for (const m of paramOrPropertyMetadata) {
			if (metadatas.some(md => md.key === m.key))
				throw new Error(`${ ERROR_MSGS.DUPLICATED_METADATA } ${ m.key.toString() }`);
		}
	}

	// set metadata
	paramOrPropertyMetadata.push(...metadatas);
	paramsOrPropertiesMetadata[key] = paramOrPropertyMetadata;
	Reflect.defineMetadata(metadataKey, paramsOrPropertiesMetadata, annotationTarget);
};


const _ensureNoMetadataKeyDuplicates = (
	metadata: interfaces.MetadataOrMetadataArray,
): interfaces.Metadata[] => {
	const metadatas: interfaces.Metadata[] = Array.isArray(metadata)
		? metadata : [ metadata ];

	if (Array.isArray(metadata)) {
		const duplicate = getFirstArrayDuplicate(metadatas.map(md => md.key));

		if (duplicate !== undefined)
			throw new Error(`${ ERROR_MSGS.DUPLICATED_METADATA } ${ duplicate.toString() }`);
	}

	return metadatas;
};


/**
 * Decorates the class with metadata for inversify to correctly inject the required bindings.
 *
 * Must be used in a class static initializer block.
 *
 * @param target - instanceof this from the static initializer block.
 * @param serviceIdentifier - identifier to the required binding.
 * @param nameofOrIndex - either a nameof function to a prop name or the parameter index to inject into.
 *
 * @example
 * ```
 * static { staticInject(this, 'test-value', i => i.testValue); }
 * protected testValue: string;
 * ```
 *
 * __
 */
export const staticInject = <T extends Prototype<unknown>>(
	target: T,
	serviceIdentifier: interfaces.ServiceIdentifier,
	nameofOrIndex: number | ((target: T['prototype']) => any),
) => {
	const metadata = new Metadata(METADATA_KEY.INJECT_TAG, serviceIdentifier);
	if (typeof nameofOrIndex === 'number')
		createTaggedDecorator(metadata, target, undefined, nameofOrIndex);
	else
		createTaggedDecorator(metadata, target, nameof(((i: T) => nameofOrIndex(i.prototype))));
};
