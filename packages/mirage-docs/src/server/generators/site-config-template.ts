import type { SiteConfig } from '../../shared/config.types.js';
import { fileExt } from '../build/helpers/is-dev-mode.js';


export const siteConfigTemplate = (siteConfig: Partial<SiteConfig>, routes: string[]) =>
`
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.${ fileExt() }'

const routes = ${ JSON.stringify(routes, null, 3) };
const siteConfig = ${ JSON.stringify(siteConfig, null, 3) };

// nameReplacements can be regexes converted to strings.
// Convert them back to regexes.
const { nameReplacements } = siteConfig.root!.sidebar!;
nameReplacements.forEach((replacement) => {
	if (typeof replacement[0] !== 'string')
		return;

	const parts = /\\/(.*)\\/(.*)/.exec(replacement[0])!;
	if (!parts)
		return;

	replacement[0] = new RegExp(parts[1]!, parts[2]!);
});

ContainerLoader.load(new ContainerModule(({bind}) => {
	bind('site-config').toConstantValue(siteConfig);
	bind('routes').toConstantValue(routes);
}));
`;
