export type Decorator = ClassDecorator | MemberDecorator;
export type MemberDecorator = <T>(target: Target, propertyKey: PropertyKey, descriptor?: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
export type MetadataKey = string | symbol;
export type PropertyKey = string | symbol;
export type Target = object | Function;


const Metadata = new WeakMap();


const decorateProperty = (decorators: MemberDecorator[], target: Target, propertyKey: PropertyKey, descriptor?: PropertyDescriptor): PropertyDescriptor | undefined => {
	for (let i = decorators.length - 1; i >= 0; i--)
		descriptor = decorators[i]!(target, propertyKey, descriptor) || descriptor;

	return descriptor;
};


const decorateConstructor = (decorators: ClassDecorator[], target: Function): Function => {
	for (let i = decorators.length - 1; i >= 0; i--) {
		const decorated = decorators[i]!(target);
		if (decorated)
			target = decorated;
	}

	return target;
};


function decorate(decorators: ClassDecorator[], target: Function): Function;
function decorate(decorators: MemberDecorator[], target: object, propertyKey?: PropertyKey, attributes?: PropertyDescriptor): PropertyDescriptor | undefined;
function decorate(decorators: Decorator[], target: Target, propertyKey?: PropertyKey, attributes?: PropertyDescriptor): Function | PropertyDescriptor | undefined {
	if (propertyKey !== undefined)
		return decorateProperty(decorators as MemberDecorator[], target, propertyKey, attributes);
	if (typeof target === 'function')
		return decorateConstructor(decorators as ClassDecorator[], target);
}


const getMetadataMap = <T>(target: Target, propertyKey?: PropertyKey): Map<MetadataKey, T> | undefined =>
	Metadata.get(target) && Metadata.get(target).get(propertyKey);


const ordinaryGetOwnMetadata = <T>(key: MetadataKey, target: Target, propertyKey?: PropertyKey): T | undefined => {
	if (target === undefined)
		throw new TypeError();

	const metadataMap = getMetadataMap<T>(target, propertyKey);

	return metadataMap && metadataMap.get(key);
};


const createMetadataMap = <T>(target: Target, propertyKey?: PropertyKey): Map<MetadataKey, T> => {
	const targetMetadata = Metadata.get(target) ?? new Map<PropertyKey | undefined, Map<MetadataKey, T>>();
	Metadata.set(target, targetMetadata);

	const metadataMap = targetMetadata.get(propertyKey) ?? new Map<MetadataKey, T>();
	targetMetadata.set(propertyKey, metadataMap);

	return metadataMap;
};


const ordinaryDefineOwnMetadata = <T>(key: MetadataKey, value: T, target: Target, propertyKey?: PropertyKey): void => {
	if (propertyKey && ![ 'string', 'symbol' ].includes(typeof propertyKey))
		throw new TypeError();

	const map = getMetadataMap<T>(target, propertyKey) ?? createMetadataMap<T>(target, propertyKey);
	map.set(key, value);
};


const ordinaryGetMetadata = <T>(key: MetadataKey, target: Target, propertyKey?: PropertyKey): T | undefined => {
	const ownMetadata = ordinaryGetOwnMetadata<T>(key, target, propertyKey);
	if (ownMetadata)
		return ownMetadata;

	const prototype = Object.getPrototypeOf(target);
	if (prototype)
		return ordinaryGetMetadata(key, prototype, propertyKey);
};


const metadata = <T>(key: MetadataKey, value: T) =>
	(target: Target, propertyKey?: PropertyKey): void =>
		void ordinaryDefineOwnMetadata<T>(key, value, target, propertyKey);


const getMetadata = <T>(key: MetadataKey, target: Target, propertyKey?: PropertyKey): T | undefined =>
	ordinaryGetMetadata<T>(key, target, propertyKey);


const getOwnMetadata = <T>(key: MetadataKey, target: Target, propertyKey?: PropertyKey): T | undefined =>
	ordinaryGetOwnMetadata<T>(key, target, propertyKey);


const hasOwnMetadata = (key: MetadataKey, target: Target, propertyKey?: PropertyKey): boolean =>
	!!ordinaryGetOwnMetadata(key, target, propertyKey);


const hasMetadata = (key: MetadataKey, target: Target, propertyKey?: PropertyKey): boolean =>
	!!ordinaryGetMetadata(key, target, propertyKey);


const defineMetadata = <T>(key: MetadataKey, value: T, target: Target, propertyKey?: PropertyKey): void =>
	void ordinaryDefineOwnMetadata(key, value, target, propertyKey);


export const ReflectMetadata = {
	decorate,
	metadata,
	defineMetadata,
	getMetadata,
	getOwnMetadata,
	hasMetadata,
	hasOwnMetadata,
};


export const useReflectMetadata = () => {
	const keys = Object.keys(ReflectMetadata);
	const existingProps = Object.getOwnPropertyNames(Reflect);
	if (existingProps.some(k => keys.includes(k)))
		return false;

	return !!Object.assign(Reflect, ReflectMetadata);
};


declare global {
	namespace Reflect {
		const decorate:       typeof ReflectMetadata.decorate;
		const defineMetadata: typeof ReflectMetadata.defineMetadata;
		const getMetadata:    typeof ReflectMetadata.getMetadata;
		const getOwnMetadata: typeof ReflectMetadata.getOwnMetadata;
		const hasOwnMetadata: typeof ReflectMetadata.hasOwnMetadata;
		const hasMetadata:    typeof ReflectMetadata.hasMetadata;
		const metadata:       typeof ReflectMetadata.metadata;
	}
}
