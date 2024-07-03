const jsonStringify = (val: any) => {
	try {
		return JSON.stringify(val);
	}
	catch (error) {
		return false;
	}
};


const jsonParse = <T>(str: string) => {
	try {
		return JSON.parse(str) as T;
	}
	catch (e) {
		return undefined;
	}
};


export const safeStringify = (val: any) => {
	if (typeof val === 'string')
		return val;

	return jsonStringify(val) || String(val);
};


export const safeParse = <T>(val: string, def?: T) => {
	const parsed = jsonParse(val);
	let value: unknown = parsed ?? def;

	if (val === 'true')
		value = true;
	else if (val === 'false')
		value = false;

	return value as T;
};
