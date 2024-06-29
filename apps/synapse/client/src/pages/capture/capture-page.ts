import { html, LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import capturePageStyles from './capture-page.css' with { type: 'css' };
import { consume, provide, type ContextProp } from '@roenlie/lit-context';
import { Routes } from '@lit-labs/router';
import { sharedStyles } from '../../app/utils/shared-styles.ts';
import { mainRoutesID } from '../../layout/main.cmp.ts';
import demofile from './components/demo-file.txt?raw';
import './components/camera.cmp.ts';
import type { Image } from './components/gallery.cmp.ts';


export const captureRoutesID = 'capture-routes';


@customElement('syn-capture-page')
export class CapturePageCmp extends LitElement {

	@provide(captureRoutesID) protected routes: Routes = new Routes(this, [
		{
			path:   'camera',
			enter:  () => !!import('./components/camera.cmp.ts'),
			render: () => html`
			<syn-capture-camera
				@picture=${ this.onPicture }
			>
				<a slot="action-start"
					tabindex="-1"
					href=${ this.routes.link('gallery') }
				>
					<button synapse>
						<span>
							Gallery
						</span>
						<span slot="end" class="counter">
							${ this.images.length }
						</span>
					</button>
				</a>

				<a slot="action-end"
					tabindex="-1"
					href=${ this.mainRoutes.value.link('') }
				>
					<button synapse>
						<svg synapse width=16>
							<use href="/bootstrap-icons.svg#x-lg"></use>
						</svg>
					</button>
				</a>
			</syn-capture-camera>
			`,
		},
		{
			path:   'gallery',
			enter:  () => !!import('./components/gallery.cmp.ts'),
			render: () => html`
			<syn-capture-gallery
				.images=${ this.images }
			></syn-capture-gallery>
			`,
		},
	]);

	@consume(mainRoutesID) protected mainRoutes: ContextProp<Routes>;
	@state() protected images:                   Image[] = [ { name: 'demo1', datauri: demofile } ];

	//@state() protected images:                   string[] = Array(100)
	//	.fill(null).map((_, i) => `https://picsum.photos/seed/${ i + 950 }/600/800`);

	protected onPicture(ev: CustomEvent<string>) {
		const srcData = ev.detail;
		this.images = [
			...this.images,
			{
				name:    (Math.random()).toString().split('.')[1]!,
				datauri: srcData,
			},
		];
	}

	protected override render(): unknown {
		return html`
		${ this.routes.outlet() }
		`;
	}

	public static override styles = [ sharedStyles, capturePageStyles ];

}
