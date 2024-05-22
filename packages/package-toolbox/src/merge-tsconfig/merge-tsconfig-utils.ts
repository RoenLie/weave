import { readFileSync } from 'node:fs';


const errors = {
	configKey: (i: number, key: string) =>
		new SyntaxError('Config key argument misplaced. index: ' + i + ', key: ' + key),
};


export const parseArgsToObject = <
	Arguments extends Record<string, string | number | boolean>
>(args: string[]) => {
	const isConfigKey = (str: string) => str.startsWith('-');

	const argObject: Record<string, string | number | boolean> = {};
	for (let i = args.length - 1; i >= 0; i--) {
		const prevString = args[i - 1];

		if (prevString !== undefined) {
			if (isConfigKey(prevString)) {
				const [ key, value ] = args.splice(i - 1, 2) as [string, string];
				argObject[key.replace(/^-+/, '')] = value;
				i = i - 1;
			}
			else {
				const [ key ] = args.splice(i, 1) as [string];
				if (isConfigKey(key))
					throw errors.configKey(i, key);

				argObject[key] = true;
			}
		}
		else {
			const [ key ] = args.splice(i, 1) as [string];
			if (isConfigKey(key))
				throw errors.configKey(i, key);

			argObject[key] = true;
		}
	}

	return argObject as Arguments;
};


export const mergeJson = <T extends Record<keyof any, any>>(...sources: T[]): T => {
	const isRecord = (v: any): v is Record<keyof any, any> =>
		typeof v === 'object' && v !== null && !Array.isArray(v);

	const merge = (
		target: Record<keyof any, any>,
		...sources: Record<keyof any, any>[]
	) => {
		for (const source of sources) {
			for (const key in source) {
				const value = source[key];

				if (isRecord(value)) {
					target[key] ??= {};
					merge(target[key], value);
				}
				else {
					target[key] = value;
				}
			}
		}

		return target as T;
	};

	const mergeTarget: Record<keyof any, any> = {};
	merge(mergeTarget, ...sources);

	return mergeTarget as T;
};


export interface TSConfig extends Record<string, any> {
	extends?: string;
}


const getTSConfig = (path: string) => {
	const raw = readFileSync(path, { encoding: 'utf-8' });
	const processed = raw
		.replaceAll(/\/\/.*/g, '')
		.replaceAll(/\r\n/g, '')
		.replaceAll(/\n/g, '')
		.replaceAll(/\t/g, '')
		.replaceAll(/,([}\]])/g, '$1');

	const tsConfig: TSConfig = JSON.parse(processed);

	return tsConfig;
};

export const getTSConfigFromPath = (path: string) =>
	getTSConfig(path);
export const getTSConfigFromModule = (module: string) =>
	getTSConfig(import.meta.resolve(module).replace(/^file:\/\//, ''));
