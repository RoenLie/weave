import { maybeSync } from '../async/maybe.ts';


export const safeJsonStringify = (val: any): string => {
	if (typeof val === 'string')
		return val;

	const [ data ] = maybeSync(() => JSON.stringify(val));

	return data || String(val);
};


export const safeJsonParse = <T>(val: string, def?: T): T => {
	const [ parsed ] = maybeSync(() => JSON.parse(val));
	let value: unknown = parsed ?? def;

	if (val === 'true')
		value = true;
	else if (val === 'false')
		value = false;

	return value as T;
};
