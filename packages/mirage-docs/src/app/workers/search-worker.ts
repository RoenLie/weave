import type { SiteConfig } from '../../shared/config.types.js';
import { ContainerLoader } from '../aegis/index.js';


export const createSearchWorker = (): Worker => {
	const { base, libDir } = ContainerLoader.get<SiteConfig>('site-config').env;

	return new Worker(base + '/' + libDir + '/workers/search-worker.js', { type: 'module' });
};
