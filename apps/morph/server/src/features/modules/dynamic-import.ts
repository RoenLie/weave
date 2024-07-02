import { builtinModules } from 'node:module';
import {
	type Context, createContext,
	type Module, SourceTextModule, SyntheticModule,
} from 'node:vm';


/**
 * @param url - URL of a source code file.
 * @returns Raw source code.
 */
async function fetchCode(url: string) {
	const response = await fetch(url);
	if (response.ok)
		return response.text();
	else
		throw new Error(`Error fetching ${ url }: ${ response.statusText }`);
}


async function createModuleFromURL(url: URL, context: Context): Promise<Module> {
	const identifier = url.toString();

	if (url.protocol === 'http:' || url.protocol === 'https:') {
		// Download the code (naive implementation!)
		const source = await fetchCode(identifier);

		// Instantiate a ES module from raw source code.
		return new SourceTextModule(source, {
			identifier,
			context,
		});
	}
	else if (url.protocol === 'node:') {
		const imported = await import(identifier);
		const exportNames = Object.keys(imported);

		return new SyntheticModule(
			exportNames,
			function() {
				for (const name of exportNames)
					this.setExport(name, imported[name]);
			},
			{ identifier, context },
		);
	}
	else if (url.protocol === 'db:') {
		const [ namespace, name ] = url.pathname.split('/');

		if (!namespace)
			throw new Error('Invalid namespace: ' + namespace);
		if (!name)
			throw new Error('Invalid name: ' + name);

		const port = Number(process.env['PORT']);
		const host = process.env['HOST'];
		const path = 'http://'
			+ host + ':' + port
			+ '/api/modules/'
			+ identifier.split('db:')[1]!;

		const source = await fetchCode(path);

		// Instantiate a ES module from raw source code.
		return new SourceTextModule(source, {
			identifier: path,
			context,
		});
	}
	else {
		// Other possible schemes could be file: and data:
		// See https://nodejs.org/api/esm.html#esm_urls
		throw new Error(
      `Unsupported URL scheme: ${ url.protocol }`,
		);
	}
}


/**
 * @param importMap Import map object.
 * @returns Link function.
 */
async function linkWithImportMap({ imports }: {imports: Record<string, string>}) {
	return async function link(
		specifier: string,
		referencingModule: SourceTextModule,
	): Promise<SourceTextModule> {
		let url;
		if (builtinModules.includes(specifier)) {
			// If the specifier is a bare module specifier for a Node.js builtin,
			// a valid "node:" protocol URL is created for it.
			url = new URL('node:' + specifier);
		}
		else if (url && url in imports) {
			// If the specifier is contained in the import map, it is used from there.
			url = new URL(imports[specifier]!);
		}
		else {
			// If the specifier is a bare module specifier, but not contained
			// in the import map, it will be resolved against the parent
			// identifier. E.g., "foo" and "https://cdn.skypack.dev/bar" will
			// resolve to "https://cdn.skypack.dev/foo". Relative specifiers
			// will also be resolved against the parent, as expected.
			url = new URL(specifier, referencingModule.identifier);
		}

		return createModuleFromURL(
			url,
			referencingModule.context,
		);
	};
}


/**
 * @returns Result of the evaluated code.
 */
export default async function dImport(
	/** URL of a source code file. */
	specifier: string,
	options?: {
		/** Optional execution context. Defaults to current context. */
		sandbox?: Context,
		/** Optional Path to import_map.json file or object. */
		imports?: Record<string, string>
	},
): Promise<any> {
	options ??= {};
	options.imports ??= {};
	options.sandbox ??= globalThis;

	// Take a specifier from the import map or use it directly.
	// The specifier must be a valid URL.
	const url = specifier in options.imports
		? new URL(options.imports[specifier]!)
		: new URL(specifier);

	// Create an execution context that provides global variables.
	const context = createContext(options.sandbox ?? globalThis);

	// Create the ES module.
	const mod = await createModuleFromURL(url, context);

	// Create a "link" function that uses an optional import map.
	const link = await linkWithImportMap({ imports: options.imports });

	// Resolve additional imports in the module.
	await mod.link(link);

	// Execute any imperative statements in the module's code.
	await mod.evaluate();

	// The namespace includes the exports of the ES module.
	return mod.namespace;
}
