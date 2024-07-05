import { MMButton } from '@roenlie/elements/button';
import { DialogConfig, MMDialog } from '@roenlie/elements/dialog';
import { systemIcons } from '@roenlie/elements/utilities';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';


MMDialog.register();
MMButton.register();


@customElement('mm-dialog-demo')
export class DialogDemo extends LitElement {

	protected handleClick() {
		const dialogCfg = new DialogConfig()
			.config({ modal: true })
			.state(() => ({
				counter: 6,
			}))
			.actions(() => ({
				laugh: () => console.log('laugh'),
			})).template({
				render: (dialog) => html`
				<div class="header">
					header

					<mm-button
						type="icon"
						variant="text"
						@click=${ () => dialog.close() }
					>
						<mm-icon template=${ systemIcons.xLg }></mm-icon>
					</mm-button>
				</div>

				<div class="body">
					body
				</div>
				`,
				style: css`
				.host {
					display: grid;
					grid-template-rows: auto 1fr;
					aspect-ratio: 1;
					height: 200px;
				}
				.header {
					display: grid;
					grid-template-columns: 1fr auto;
					align-items: center;
				}
				`,
			});

		dialogCfg.create(this).complete.then(() => {
			console.log('you can also listen for close promise!!');
		});
	}

	protected override render() {
		return html`
		<mm-button @click=${ this.handleClick }>OPEN</mm-button>
		`;
	}

	public static override styles = [
		css`
		:host {
			display: grid;
		}
		`,
	];

}
