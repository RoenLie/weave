import { html, LitElement } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import galleryStyles from './gallery.css' with { type: 'css' };
import { map } from 'lit/directives/map.js';
import { consume, type ContextProp } from '@roenlie/lit-context';
import type { Routes } from '@lit-labs/router';
import { sharedStyles } from '../../../app/utils/shared-styles.ts';
import { captureRoutesID } from '../capture-page.ts';


@customElement('syn-capture-gallery')
export class CaptureGalleryCmp extends LitElement {

	@query('s-focus-image') protected focusWrapper:    HTMLElement;
	@consume(captureRoutesID) protected captureRoutes: ContextProp<Routes>;
	@property({ type: Array }) public images:          string[];
	@state() protected focusImageEl?:                  HTMLImageElement;
	protected focusImageOriginal:                      HTMLImageElement;
	protected animating = false;

	protected onImgClick(ev: Event) {
		if (this.animating)
			return;

		const target = ev.composedPath().find(ev => ev instanceof HTMLImageElement);
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

	protected onImgClose() {
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

	protected override render(): unknown {
		return html`
		<section @click=${ this.onImgClick }>
		${ map(this.images, (image) => html`
			<img .src=${ image }>
		`) }
		</section>

		<s-actions>
			<a href=${ this.captureRoutes.value.link('camera') }>
				<button synapse>
					<span>Camera</span>
				</button>
			</a>

			<button synapse outlined>
				<span slot="start">❤️</span>
				<span>hello there</span>
				<span slot="end">☀️</span>
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
