import { injectable } from '@roenlie/lit-aegis';

import { signalState } from '../../app/rerender.js';
import type { ForgeFile } from '../filesystem/forge-file.js';


@injectable()
export class ExplorerStore {

	@signalState() public project = 'test';
	@signalState() public files: ForgeFile[] = [];
	@signalState() public activeScript?: ForgeFile;
	@signalState() public activeComponent?: ForgeFile;

}

Ag.registerIdentifier('explorerStore');
declare global { interface Ag { readonly explorerStore: unique symbol; }}
