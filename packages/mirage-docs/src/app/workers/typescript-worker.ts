import { ContainerLoader } from '@roenlie/lit-aegis';

import type { SiteConfig } from '../../shared/config.types.js';


export const createTSWorker = () => {
	const { base, libDir } = ContainerLoader.get<SiteConfig>('site-config').env;

	return new Worker(base + '/' + libDir + '/workers/typescript-worker.js', { type: 'module' });
};
