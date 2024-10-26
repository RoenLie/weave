import { Adapter, AppComponent, customElement } from '@roenlie/sanguine';
import { css, html } from 'lit';
import type { Scopes } from '../../app/definitions.ts';


@customElement('ho-top-nav')
export class TopNavCmp extends AppComponent<Scopes> {

	constructor() {
		super({
			type:    'defined',
			scope:   s => s.root,
			adapter: TopNavAdapter,
		});
	}

}


export class TopNavAdapter extends Adapter<TopNavCmp> {

	public override render(): unknown {
		return html`
		<nav>
			<a href="/home">
				Home
			</a>
			<a href="/settings">
				Settings
			</a>
		</nav>
		`;
	}

	public static override styles = css`
	:host {
		height: 64px;
		border-bottom: 1px solid white;
	}
	nav {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: max-content;
		gap: 8px;
	}
	`;

}
