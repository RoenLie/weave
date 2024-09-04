import { css, html, LitElement, render, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { icon } from './icons.ts';
import { classMap } from 'lit/directives/class-map.js';


@customElement('b-app')
export class BuilderApp extends LitElement {

	@query('iframe') protected iframe: HTMLIFrameElement;
	@state() protected activeAction:   'pointer' | 'frame' = 'pointer';

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected override firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);

		window.addEventListener('message', (ev) => {
			console.log(ev);

			if (ev.data.type === 'click') {
				if (this.activeAction === 'frame') {
					this.iframe.contentWindow?.postMessage({
						type:    'new-frame',
						details: {
							style: {
								position:        'absolute',
								top:             (ev.data.details.y - 50) + 'px',
								left:            (ev.data.details.x - 50) + 'px',
								width:           '100px',
								height:          '100px',
								backgroundColor: 'white',
								borderRadius:    '8px',
							},
						},
					});

					this.activeAction = 'pointer';
				}
			}
		});
	}

	protected save() {
		import.meta.hot?.send('save', {
			tagname: 'hei der',
		});
	}

	protected onSelectAction(ev: Event) {
		const actionEl = [ ...ev.composedPath() ]
			.filter(el => el instanceof HTMLElement)
			.find(el => el.tagName === 'S-TOOL-ACTION');

		if (!actionEl)
			return;

		this.activeAction = actionEl
			.dataset['action'] as typeof this.activeAction;
	}

	protected override render() {
		return html`
		<s-navigation>
			<span>Directory selector and stuff</span>
		</s-navigation>

		<s-workarea>
			<iframe src="/iframe.html"></iframe>

			<s-toolbar @click=${ this.onSelectAction }>
				<s-tool-action
					class=${ classMap({ active: this.activeAction === 'pointer' }) }
					data-action=${ 'pointer' }
				>
					${ icon('cursor') }
				</s-tool-action>

				<s-tool-action
					class=${ classMap({ active: this.activeAction === 'frame' }) }
					data-action=${ 'frame' }
				>
					${ icon('square') }
				</s-tool-action>
			</s-toolbar>
		</s-workarea>


		<s-toolbox>
			<button @click=${ this.save }>
				Save data
			</button>
		</s-toolbox>
		`;
	}

	public static override styles = css`
		iframe {
			all: unset;
		}
		:host {
			display: grid;
			grid-template-rows: 80px 1fr;
			grid-template-columns: minmax(25vw, max-content) 1fr minmax(25vw, max-content);
			padding: 12px;
			gap: 12px;
		}
		s-navigation {
			grid-row: 1/3;
			grid-column: 1/2;

			/*background-color: rgb(20 40 70);*/
			padding: 12px;
			border-radius: 8px;
			border: 1px solid rgb(255 255 255 / 0.3);
		}

		s-workarea {
			position: relative;
			display: grid;
			grid-row: 1/3;
			grid-column: 2/3;

			iframe {
				height: 100%;
				width: 100%;
				border: 1px solid rgb(255 255 255 / 0.3);
				border-radius: 12px;
			}
		}

		s-toolbar {
			contain: paint;
			position: absolute;
			bottom: 12px;
			justify-self: center;
			display: flex;
			flex-flow: row nowrap;

			min-width: 30vw;

			/*background-color: rgb(20 40 70);*/
			border-radius: 8px;
			border: 1px solid rgb(255 255 255 / 0.3);

			s-tool-action {
				cursor: pointer;
				display: flex;
				flex-flow: row nowrap;
				align-items: center;
				padding: 8px;
				width: fit-content;
				height: fit-content;
				&:hover {
					background-color: rgb(0 0 0 / 0.3);
				}
				&.active {
					background-color: rgb(0 0 0 / 0.5);
				}
			}
		}

		s-toolbox {
			grid-row: 1/3;
			grid-column: 3/4;

			/*background-color: rgb(20 40 70);*/
			padding: 12px;
			border-radius: 8px;
			border: 1px solid rgb(255 255 255 / 0.3);
		}
	`;

}
render(document.createElement('b-app'), document.body);
