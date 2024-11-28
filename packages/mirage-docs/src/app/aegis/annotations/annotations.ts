import { useReflectMetadata } from '@roenlie/reflect-metadata';
import {
	inject as _inject,
	METADATA_KEY,
	multiInject as _multiInject,
	named as _named,
	tagged as _tagged,
	unmanaged as _unmanaged,
} from 'inversify';


export const injectable = () => {
	useReflectMetadata();

	return <T extends abstract new(...args: any) => unknown>(target: T) => {
		if (Reflect.hasOwnMetadata(METADATA_KEY.PARAM_TYPES, target))
			return target;

		const types = Reflect.getMetadata(METADATA_KEY.DESIGN_PARAM_TYPES, target) || [];
		Reflect.defineMetadata(METADATA_KEY.PARAM_TYPES, types, target);

		return target;
	};
};


export const inject = _inject;
export const multiInject = _multiInject;
export const named = _named;
export const tagged = _tagged;
export const unmanaged = _unmanaged;
