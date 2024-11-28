import { ContainerLoader } from '../aegis/index.js';

import type { SiteConfig } from '../../shared/config.types.js';


export const createSearchWorker = () => {
	const { base, libDir } = ContainerLoader.get<SiteConfig>('site-config').env;

	return new Worker(base + '/' + libDir + '/workers/search-worker.js', { type: 'module' });
};
