import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';


const errors = {
	configKey: (i: number, key: string) =>
		new SyntaxError('Config key argument misplaced. index: ' + i + ', key: ' + key),
};


export const parseArgsToObject = <
	Arguments extends Record<string, string | number | boolean>,
>(args: string[]): Arguments => {
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


const getTSConfig = (path: string): TSConfig | undefined => {
	if (!existsSync(path))
		return;

	const raw = readFileSync(path, { encoding: 'utf-8' });
	const processed = raw
		.replaceAll(/\/\/.*/g, '')
		.replaceAll(/\r\n/g, '')
		.replaceAll(/\n/g, '')
		.replaceAll(/\t/g, '')
		.replaceAll(/,([}\]])/g, '$1');

	try {
		const tsConfig: TSConfig = JSON.parse(processed);

		return tsConfig;
	}
	catch (error) {
		console.error('Could not parse tsconfig. ' + path);
		console.error(error);

		return;
	}
};

export const getTSConfigFromPath = (path: string): TSConfig | undefined =>
	getTSConfig(path);

export const getTSConfigFromModule = (module: string): TSConfig | undefined =>
	getTSConfig(fileURLToPath(import.meta.resolve(module)));
