export const isEmptyObject = (obj: any): obj is {} => !Object.keys(obj).length;


export const isObject = (obj: any): obj is Record<keyof any, any> => {
	return Object.prototype.toString.call(obj) === '[object Object]';
};


export const isPlainObject = (obj: any): obj is Record<keyof any, any> => {
	if (isObject(obj) === false)
		return false;

	// If has modified constructor
	const ctor = obj.constructor;
	if (ctor === undefined)
		return true;

	// If has modified prototype
	const prot = ctor.prototype;
	if (isObject(prot) === false)
		return false;

	// If constructor does not have an Object-specific method
	if (prot.hasOwnProperty('isPrototypeOf') === false)
		return false;

	// Most likely a plain Object
	return true;
};
