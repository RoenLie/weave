import type { SiteConfig } from '../shared/config.types.js';
import { indexPageTemplate } from './generators/index-page-template.js';


export const createIndexFile = (
	styleLinks: NonNullable<SiteConfig['pages']>['styles'],
	scriptLinks: NonNullable<SiteConfig['pages']>['scripts'],
	componentPath: string,
	siteConfigPath: string,
) => {
	const content = indexPageTemplate({
		moduleId:     componentPath,
		siteConfigId: siteConfigPath,
		styleLinks,
		scriptLinks,
	});

	return content;
};
