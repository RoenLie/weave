import { html, LitElement, type PropertyValues } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import capturePageStyles from './capture-page.css' with { type: 'css' };
import { consume, provide, type ContextProp } from '@roenlie/lit-context';
import { Routes } from '@lit-labs/router';
import { sharedStyles } from '../../app/utils/shared-styles.ts';
import { mainRoutesID } from '../../layout/main.cmp.ts';
import demofile from './components/demo-file.txt?raw';
import './components/camera.cmp.ts';
import type { Image } from './components/gallery.cmp.ts';
import { domId } from '@roenlie/core/dom';
import { IndexDBWrapper } from '@roenlie/core/indexdb';
import { CaptureSession } from './capture-session.ts';


export const captureRoutesID = 'capture-routes';


@customElement('syn-capture-page')
export class CapturePageCmp extends LitElement {

	@provide(captureRoutesID) protected routes: Routes = new Routes(this, [
		{
			path:   'camera',
			enter:  () => !!import('./components/camera.cmp.ts'),
			render: () => html`
			<syn-capture-camera @picture=${ this.onPicture }>
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
				@submit=${ this.onSubmit }
			></syn-capture-gallery>
			`,
		},
	]);

	@consume(mainRoutesID) protected mainRoutes: ContextProp<Routes>;
	@state() protected images:                   Image[] = [];
	protected hash:                              string = domId();
	protected sessionRestored = false;

	//@state() protected images:                   string[] = Array(100)
	//	.fill(null).map((_, i) => `https://picsum.photos/seed/${ i + 950 }/600/800`);

	public override connectedCallback(): void {
		super.connectedCallback();
		this.restoreSession();
	}

	protected override willUpdate(props: PropertyValues): void {
		super.willUpdate(props);

		if (this.sessionRestored && props.has('images')) {
			IndexDBWrapper.connect('synapse')
				.collection(CaptureSession)
				.put(new CaptureSession({ hash: this.hash, images: this.images }), 'current');
		}
	}

	protected async restoreSession() {
		const col = IndexDBWrapper.connect('synapse')
			.collection(CaptureSession);

		const currentSession = await col.get('current');

		if (currentSession) {
			this.hash = currentSession.hash;
			this.images = currentSession.images;

			// we await, to avoid saving the already cached session.
			await this.updateComplete;
		}
		else {
			this.hash = domId();
			this.images = [
				{
					directory: this.hash,
					name:      'demo1',
					datauri:   demofile,
				},
			];
		}

		this.sessionRestored = true;
	}

	protected onPicture(ev: CustomEvent<string>) {
		const srcData = ev.detail;
		this.images = [
			...this.images,
			{
				directory: this.hash,
				name:      (Math.random()).toString().split('.')[1]!,
				datauri:   srcData,
			},
		];
	}

	protected onSubmit() {
		history.pushState(undefined, '', this.mainRoutes.value.link(''));
		window.dispatchEvent(new PopStateEvent('popstate'));
	}

	protected override render(): unknown {
		return html`
		${ this.routes.outlet() }
		`;
	}

	public static override styles = [ sharedStyles, capturePageStyles ];

}
