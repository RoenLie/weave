import { Endpoint, method } from '../app/endpoint.ts';
import { getModule, moduleImportToParts } from '../services/module-service.ts';
import { createCacheSlug, handleTypescript } from '../services/transpile-ts.ts';


@method.get('/api/modules/*')
class GetModule extends Endpoint {

	protected override async handle(): Promise<any> {
		const url = this.request.params['0'];
		if (!url)
			return this.response.sendStatus(404);

		const { domain, subdomain, path } = moduleImportToParts(url);

		const module = getModule(domain, subdomain, path);
		if (!module)
			return this.response.sendStatus(404);

		let transpiled = module.content;
		if (module.path.endsWith('.ts')) {
			const cacheSlug = createCacheSlug(module);
			transpiled = await handleTypescript(cacheSlug, module.content);
		}

		const importExp = /(?:import|from) ["'](?!\.)([\w@\-/.:]+)["']/g;
		// Append the importmap specifier before any absolute imports.
		// Need to do this due to a importmap limitation where it
		// does not allow redirecting all imports, as of sep 2024.
		transpiled = transpiled.replaceAll(importExp,
			(str, path) => str.replace(path, '@package/' + path));


		this.response.header('Content-Type', 'text/javascript;charset=UTF-8');
		this.response.send(transpiled);
	}

}


export default [ GetModule ];
