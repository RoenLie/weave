import { signal } from '@lit-labs/preact-signals';

import type { IModule } from '../../../../models/modules-model.js';


export class ModulesStore {

	public selectedModule = signal<IModule | undefined>(undefined);
	public modules = signal<IModule[]>([]);

}
