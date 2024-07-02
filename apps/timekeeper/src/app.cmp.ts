import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { guard } from 'lit/directives/guard.js';

import { ContentController } from './components-pure/content/content-controller.js';
import { Content } from './components-pure/content/content-utility.js';

/* ------------------------------------------------- */

@customElement('mi-timekeeper-dimension')
export class MiTimekeeperCmp extends LitElement {

	//#region properties
	protected selectedContent = 'planner';
	protected selectedNav = 'calender-navigation';
	//#endregion


	//#region controllers
	protected readonly contentCtrl = new ContentController({ host: this });
	//#endregion


	//#region lifecycle
	public override async connectedCallback() {
		super.connectedCallback();

		this.contentCtrl.registerContent([
			{
				category:  'sidepanel',
				component: Content.createContent(
					'calender-navigation',
					'Calender Navigation',
					() => html`
					<mi-calender-navigation></mi-calender-navigation>
					`,
				),
			},
			{
				category:  'sidepanel',
				component: Content.createContent('action-sidebar', 'Action Sidebar', () => html`
				<mi-action-sidebar></mi-action-sidebar>
				`),
			},
			{
				category:  'focus',
				component: Content.createContent(
					'planner',
					'Planner',
					() => html`
					<mi-calender-planner></mi-calender-planner>
					`,
				),
			},
		]);

		this.contentCtrl.observeCategory('all', () => { this.requestUpdate(); });
		this.contentCtrl.observeCategory('focus', ({ id, operation }) => {
			if (operation === 'clear')
				this.selectedContent = '';
			if (operation === 'remove' && id === this.selectedContent)
				this.selectedContent = '';

			this.requestUpdate();
		});
	}
	//#endregion


	//#region logic
	protected handleSelectContent(ev: HTMLElementEventMap['mi-select-content']) {
		const { id } = ev.detail;
		this.selectedContent = id;
		this.requestUpdate();
	}
	//#endregion


	//#region template
	public override render() {
		return html`
		<div class="timekeeper-base">
			<mi-content-container
				class="nav-cont"
				style="grid-area: nav-cont"
				.contentId=${ this.selectedNav }
			></mi-content-container>

			${ guard([ this.selectedContent ], () => html`
				<mi-content-container
					class="main-cont"
					style="grid-area: main-cont"
					.contentId=${ this.selectedContent }
				></mi-content-container>
			`) }

			<mi-content-container
				class="action-cont"
				style="grid-area: action-cont"
				category="sidebar"
				.contentId=${ 'action-sidebar' }
			></mi-content-container>
		</div>
		`;
	}
	//#endregion


	//#region style
	public static override styles = [
		css`
		:host {
		}
		.timekeeper-base {
			height: 100%;
			display: grid;
			grid-template-areas: "nav-cont main-cont action-cont";
			grid-template-columns: auto 1fr auto;
			grid-template-rows: 1fr;

			color: var(--mitm-on-surface);
			background-color: var(--mitm-surface);
		}
		.tab-cont {
			padding: 12px;
			border-bottom: 2px solid var(--surface-variant);
		}
		.nav-cont {
			border-right: 2px solid var(--surface-variant);
			background-color: var(--surface1);
		}
		.main-cont {
			display: grid;
		}
		.action-cont {
			border-left: 1px solid var(--surface-variant);
		}
		`,
	];
	//#endregion

}

/* ------------------------------------------------- */

declare global {
	interface HTMLElementTagNameMap {
		'mi-timekeeper-dimension': MiTimekeeperCmp;
	}
}
