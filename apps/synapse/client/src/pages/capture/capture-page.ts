import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import capturePageStyles from './capture-page.css' with { type: 'css' };
import { consume, type ContextProp } from '@roenlie/lit-context';
import type { Routes } from '@lit-labs/router';
import './components/camera.cmp.ts';


@customElement('syn-capture-page')
export class CapturePageCmp extends LitElement {

	@consume('main-routes') protected routes: ContextProp<Routes>;
	@state() protected mode:                  'camera' | 'gallery' = 'camera';
	@state() protected images:                string[] = [];

	public override connectedCallback(): void {
		super.connectedCallback();
		this.updateComplete.then(() => this.afterConnected());
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();
	}

	protected async afterConnected() {
	}

	protected onClickBack(ev: Event) {
		ev.preventDefault();
	}

	protected onPicture(ev: CustomEvent<string>) {
		const srcData = ev.detail;
		console.log(srcData);
	}

	protected renderGallery() {
		return html`

		`;
	}

	protected override render(): unknown {
		return html`
		<s-top-controls>
		</s-top-controls>

		<syn-capture-camera
			@picture=${ this.onPicture }
		>
			<button slot="action-start">
				Gallery
			</button>

			<button slot="action-end" @click=${ () => history.back() }>
				X
			</button>
		</syn-capture-camera>
		`;
	}
	//<section>
	//	<video id="video"
	//		class=${ classMap({ hidden: this.mode !== 'camera' }) }
	//		width   =${ this.width }
	//		@touchstart=${ this.cameraZoom }
	//		@canplay=${ this.onCanPlay }
	//	>
	//		Video stream not available.
	//	</video>

	//	<img id="photo"
	//		class=${ classMap({ hidden: this.mode !== 'gallery' }) }
	//		alt="The screen capture will appear in this box."
	//		.src=${ this.displayedImgSrc }
	//	>
	//</section>

	//<s-actions>
	//	<button
	//		class=${ classMap({ hidden: this.mode !== 'camera' }) }
	//		@click=${ this.onClickButton }
	//	>
	//		Take photo
	//	</button>

	//	<button
	//		class=${ classMap({ hidden: this.mode !== 'gallery' }) }
	//		@click=${ this.onClickBack }
	//	>
	//		Back
	//	</button>
	//</s-actions>

	public static override styles = [ capturePageStyles ];

}
