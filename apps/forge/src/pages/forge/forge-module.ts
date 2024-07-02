import { ContainerModule } from '@roenlie/lit-aegis';

import { ExplorerStore } from '../../features/stores/explorer-store.js';


export const forgeModule = new ContainerModule(({ bind }) => {
	bind(Ag.explorerStore).to(ExplorerStore).inSingletonScope();
});
