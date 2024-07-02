import { signal } from '@lit-labs/preact-signals';

export class TablesStore {

	public name = signal('');
	public items = signal([]);

}
