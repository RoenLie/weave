import dImport from './dynamic-import.js';


export const sandbox = {
	dImport: (specifier: string) => dImport(specifier, { sandbox }),
};
