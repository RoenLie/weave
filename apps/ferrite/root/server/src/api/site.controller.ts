import { Endpoint, method } from '../app/endpoint.ts';
import { getModule, moduleImportToParts } from '../services/module-service.ts';


@method.get('*')
class SiteRedirect extends Endpoint {

	protected override async handle(): Promise<any> {
		const module = getModule('std', 'site', 'redirect-config.json');
		if (!module)
			return this.response.sendStatus(404);

		const routes: Record<string, string> = JSON.parse(module.content);
		const route = routes[this.request.url];

		if (route) {
			const { domain, subdomain, path } = moduleImportToParts(route);
			const module = getModule(domain, subdomain, path);
			if (!module)
				return;

			const content = module.content.replace(
				'<head>', str => str + '\n\t'
				+ '<script type="importmap">'
				+ '{"imports":{'
				+ '"@/":"./api/modules/",'
				+ '"@package/": "./api/packages/"'
				+ '}}'
				+ '</script>',
			);

			return this.response.send(content);
		}

		this.response.sendStatus(404);
	}

}


export default [ SiteRedirect ];
