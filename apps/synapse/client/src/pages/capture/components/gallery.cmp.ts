import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import galleryStyles from './gallery.css' with { type: 'css' };
import { map } from 'lit/directives/map.js';
import { consume, type ContextProp } from '@roenlie/lit-context';
import type { Routes } from '@lit-labs/router';
import { sharedStyles } from '../../../app/shared-styles.ts';
import { captureRoutesID } from '../capture-page.ts';
import { dataURItoBlob } from '../../../app/datauri-to-blob.ts';
import { IndexDBWrapper } from '@roenlie/core/indexdb';
import { CaptureSession } from '../capture-session.ts';
import { emitEvent } from '@roenlie/core/dom';
import { synapseIndexDB } from '../../../app/index-db.ts';
import { maybe } from '@roenlie/core/async';
import { ServerURL } from '../../../app/server-url.ts';


export interface Image {
	hash:    string;
	name:    string;
	datauri: string;
};


@customElement('syn-capture-gallery')
export class CaptureGalleryCmp extends LitElement {

	@query('s-focus-image') protected focusWrapper:    HTMLElement;
	@consume(captureRoutesID) protected captureRoutes: ContextProp<Routes>;
	@property({ type: Array }) public images:          Image[];
	@state() protected focusImageEl?:                  HTMLElement;
	protected focusImageOriginal:                      HTMLElement;
	protected animating = false;

	public override connectedCallback(): void {
		super.connectedCallback();
	}

	protected onImgClick(ev: Event): void {
		if (this.animating)
			return;

		const target = ev.composedPath().find(ev =>
			(ev as HTMLElement).localName === 's-img-wrapper') as HTMLElement
			;
		if (!target)
			return;

		this.focusImageOriginal = target;
		this.focusImageEl = target.cloneNode(true) as HTMLImageElement;
		const targetRect = target.getBoundingClientRect();
		const originalStyle = this.focusImageOriginal.computedStyleMap();
		const originalBorderRadius = originalStyle.get('border-radius')?.toString();

		this.focusImageEl.animate([
			{ borderRadius: originalBorderRadius },
			{ borderRadius: '0px' },
		], {
			duration: 1000,
			easing:   'ease-out',
			fill:     'forwards',
		});

		this.focusWrapper.animate([
			{
				visibility:   'visible',
				top:          targetRect.top + 'px',
				left:         targetRect.left + 'px',
				bottom:       window.innerHeight - targetRect.bottom  + 'px',
				right:        window.innerWidth - targetRect.right + 'px',
				borderRadius: originalBorderRadius,
			},
			{
				visibility:   'visible',
				inset:        '0%',
				borderRadius: '0px',
				opacity:      1,

			},
		], {
			duration: 1000,
			easing:   'ease-out',
			fill:     'forwards',
		}).addEventListener('finish', () => {
			this.animating = false;
		}, { once: true });

		this.animating = true;
	}

	protected onImgClose(): void {
		if (this.animating)
			return;

		const targetRect = this.focusImageOriginal.getBoundingClientRect();
		const originalStyle = this.focusImageOriginal.computedStyleMap();
		const originalBorderRadius = originalStyle.get('border-radius')?.toString();

		this.focusImageEl!.animate([
			{ borderRadius: '0px' },
			{ borderRadius: originalBorderRadius },
		], {
			duration: 1000,
			easing:   'ease-out',
			fill:     'forwards',
		});

		this.focusWrapper.animate([
			{
				visibility:   'visible',
				inset:        '0%',
				borderRadius: '0px',
			},
			{
				visibility:   'hidden',
				top:          targetRect.top + 'px',
				left:         targetRect.left + 'px',
				bottom:       window.innerHeight - targetRect.bottom  + 'px',
				right:        window.innerWidth - targetRect.right + 'px',
				borderRadius: originalBorderRadius,
				opacity:      0.8,
			},
		], {
			duration: 1000,
			easing:   'ease-out',
			fill:     'forwards',
		}).addEventListener('finish', () => {
			this.focusImageEl = undefined;
			this.animating = false;
		}, { once: true });

		this.animating = true;
	}

	protected async onSubmit(): Promise<void> {
		const formData = new FormData();
		formData.set('hash', this.images[0]?.hash ?? '');

		this.images.map(img => {
			const blob = dataURItoBlob(img.datauri);
			formData.append(img.name, blob, img.name);
		});

		const url = new ServerURL('/api/capture/upload');
		const [ _, error ] = await maybe(fetch(url, {
			method: 'post',
			body:   formData,
		}).then(r => r.status));

		if (error)
			return;

		emitEvent(this, 'submit');

		IndexDBWrapper.connect(synapseIndexDB)
			.collection(CaptureSession)
			.delete('current');
	}

	protected override render(): unknown {
		return html`
		<section @click=${ this.onImgClick }>
		${ map(this.images, (image) => html`
			<s-img-wrapper>
				<img .src=${ image.datauri }>
			</s-img-wrapper>
		`) }
		</section>

		<s-actions>
			<a href=${ this.captureRoutes.value.link('camera') }>
				<button synapse>
					<span>Camera</span>
				</button>
			</a>

			<button synapse outlined @click=${ this.onSubmit }>
				<span>Submit</span>
			</button>
		</s-actions>

		<s-focus-image>
			<s-focus-controls>
				<button synapse @click=${ this.onImgClose }>
					<svg synapse>
						<use href="/bootstrap-icons.svg#x-lg"></use>
					</svg>
				</button>
			</s-focus-controls>
			${ this.focusImageEl }
		</s-focus-image>
		`;
	}

	public static override styles = [ sharedStyles, galleryStyles ];

}
