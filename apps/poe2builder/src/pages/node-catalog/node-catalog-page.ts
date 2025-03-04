import { CustomElement } from '@roenlie/custom-element';
import { createClient } from '@supabase/supabase-js';


export class PoeNodeCatalog extends CustomElement {

	static { this.register('poe-node-catalog'); }

	protected worker: Worker;

	protected override async connectedCallback(): Promise<void> {
		super.connectedCallback();

		const supabase = createClient(
			import.meta.env.VITE_SUPABASE_URL,
			import.meta.env.VITE_SUPABASE_ANON_KEY,
		);

		await supabase.auth.signInWithPassword({
			email:    import.meta.env.VITE_SUPABASE_EMAIL,
			password: import.meta.env.VITE_SUPABASE_PASSWORD,
		});

		this.worker = new Worker(
			new URL('./catalog-worker.ts', import.meta.url),
			{ type: 'module' },
		);

		const storageKey = (supabase as any).storageKey;

		this.worker.postMessage({
			type:    'login',
			storageKey,
			session: localStorage.getItem(storageKey),
		});
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();
		this.worker.terminate();
	}

}
