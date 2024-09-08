import { css, html, LitElement, render, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { icon } from './icons.ts';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';


@customElement('b-app')
export class BuilderApp extends LitElement {

	@query('iframe') protected iframe: HTMLIFrameElement;
	@state() protected activeAction:   'pointer' | 'frame' = 'pointer';

	@state() protected activeComponent?: {
		tag:    string;
		styles: {
			backgroundColor: string;
		};
		path: string;
	};

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected override firstUpdated(_changedProperties: PropertyValues): void {
		super.firstUpdated(_changedProperties);

		import.meta.hot?.on('select-component', (payload: {
			tag:    string;
			styles: { backgroundColor: string; };
			path:   string;
		}) => {
			this.activeComponent = {
				tag:    payload.tag,
				styles: payload.styles,
				path:   payload.path,
			};

			console.log(payload);

			//console.log('got payload with information about component', payload);
		});

		import.meta.hot?.on('frame-reload', () => {
			this.iframe.contentWindow?.location.reload();
		});

		window.addEventListener('message', (ev) => {
			this.onIframeMessage(ev.data);
		});
	}

	protected onIframeMessage(data: {
		type: 'click' | string;
		x:    number;
		y:    number;
		path: {
			id:    string;
			tag:   string;
			class: string;
		}[]
	}) {
		console.log(data);

		if (data.type === 'click') {
			const parentCmp = data.path.slice(1)
				.find(p => !!this.iframe.contentWindow?.customElements.get(p.tag));

			import.meta.hot?.send('select-component', {
				tag:       data.path[0]?.tag,
				parentTag: parentCmp?.tag,
			});
		}
	}

	protected onColorChange(ev: Event) {
		console.log(ev);

		const newColor = (ev.currentTarget as HTMLInputElement)
			.value;

		import.meta.hot?.send('patch-styles', {
			tag:    this.activeComponent!.tag,
			path:   this.activeComponent!.path,
			styles: {
				backgroundColor: newColor,
			},
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
			${ when(this.activeComponent, cmp => html`
				<div>${ cmp.tag }</div>
				<input
					type="color"
					value=${ cmp.styles.backgroundColor }
					@change=${ this.onColorChange }
				>
			`) }
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
