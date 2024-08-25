import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import cameraStyles from './camera.css' with { type: 'css' };
import { map } from 'lit/directives/map.js';
import { classMap } from 'lit/directives/class-map.js';
import { sharedStyles } from '../../../app/shared-styles.ts';
import { maybe } from '@roenlie/core/async';


@customElement('syn-capture-camera')
export class CaptureCameraCmp extends LitElement {

	@query('section') protected sectionEl: HTMLElement;
	@query('#video')  protected videoEl:   HTMLVideoElement;
	@state() protected width = NaN;
	@state() protected currentZoom = NaN;
	protected minZoom = NaN;
	protected maxZoom = NaN;
	protected stepZoom = NaN;
	protected canvas = document.createElement('canvas');
	protected zoomButtonArr:               any[] = [];

	public override connectedCallback(): void {
		super.connectedCallback();
		this.updateComplete.then(() => this.afterConnected());
	}

	public override disconnectedCallback(): void {
		super.disconnectedCallback();

		const stream = this.videoEl.srcObject as MediaStream | null;
		stream?.getVideoTracks().forEach(track => track.stop());
	}

	protected async afterConnected() {
		this.width = this.sectionEl.offsetWidth;
		this.setCameraMode();
	}

	protected async setCameraMode() {
		const sectionEl = this.sectionEl;
		const aspectRatio = Math.max(1,
			(Math.round(sectionEl.offsetHeight / sectionEl.offsetWidth * 10) / 10) - 0.2);

		const [ stream, error ] = await maybe(
			navigator.mediaDevices.getUserMedia({
				video: {
					facingMode:  'environment',
					aspectRatio: { exact: aspectRatio },
					advanced:    [
						{ width: { exact: 2560 } },
						{ width: { exact: 1920 } },
						{ width: { exact: 1280 } },
						{ width: { exact: 1024 } },
						{ width: { exact: 900 } },
						{ width: { exact: 800 } },
						{ width: { exact: 640 } },
						{ width: { exact: 320 } },
					],
				},
				audio: false,
			}),
		);

		if (error)
			return console.error(`An error occurred: ${ error }`);

		this.videoEl.srcObject = stream;
		this.videoEl.play();

		const track = stream.getVideoTracks()[0]!;
		const capabilities = track.getCapabilities();
		const settings = track.getSettings();

		this.minZoom = capabilities.zoom!.min;
		this.maxZoom = capabilities.zoom!.max;
		this.stepZoom = capabilities.zoom!.step;
		this.currentZoom = settings.zoom!;
		this.zoomButtonArr = Array(this.maxZoom).fill(null);
	}

	protected takepicture() {
		const context = this.canvas.getContext('2d')!;
		const { videoWidth, videoHeight } = this.videoEl;

		this.canvas.height = videoHeight;
		this.canvas.width = videoWidth;

		context.drawImage(this.videoEl, 0, 0, videoWidth, videoHeight);

		const data = this.canvas.toDataURL('image/png');

		this.dispatchEvent(new CustomEvent('picture', { detail: data }));
	}

	protected cameraZoom = (() => {
		let initialZoom = this.currentZoom;
		let initialDistanceX = NaN;
		let track: MediaStreamTrack;

		let currentPromise: Promise<void> | undefined;

		const touchstart = (ev: TouchEvent) => {
			if (ev.touches.length < 2)
				return;

			ev.preventDefault();

			const stream = this.videoEl.srcObject as MediaStream | null;
			if (!stream)
				throw new Error('No stream found');

			track = stream.getVideoTracks()[0]!;

			const [ touch1, touch2 ] = ev.touches as unknown as [Touch, Touch];

			initialDistanceX = Math.abs(touch1.clientX - touch2.clientX);
			initialZoom = this.currentZoom;

			this.addEventListener('touchmove', touchmove);
			this.addEventListener('touchend', touchend);
		};
		const touchmove = (ev: TouchEvent) => {
			if (currentPromise)
				return;

			const [ touch1, touch2 ] = ev.touches as unknown as [Touch, Touch];

			const distance  = Math.abs(touch1.clientX - touch2.clientX) - initialDistanceX;
			const zoomFactor = distance / this.maxZoom;
			const multiplier = 1 / 10;

			const decimals = (this.stepZoom * 100);

			let zoom = Math.round(zoomFactor * multiplier * decimals) / decimals;
			zoom = Math.min(Math.max(zoom + initialZoom, this.minZoom), this.maxZoom);

			this.currentZoom = zoom;

			currentPromise = track.applyConstraints({ advanced: [ { zoom } ] })
				.then(() => currentPromise = undefined);
		};
		const touchend = (_ev: TouchEvent) => {
			this.removeEventListener('touchmove', touchmove);
			this.removeEventListener('touchend', touchend);
		};

		return touchstart;
	})();

	protected onClickButton(ev: Event) {
		ev.preventDefault();
		this.takepicture();
	}

	protected onClickZoom(ev: Event) {
		const target = ev.currentTarget as HTMLElement;
		const zoom = Number(target.dataset['zoom']);

		const stream = this.videoEl.srcObject as MediaStream | null;
		if (!stream)
			throw new Error('No stream found');

		const track = stream.getVideoTracks()[0]!;

		this.currentZoom = zoom;

		track.applyConstraints({ advanced: [ { zoom } ] });
	}

	protected override render(): unknown {
		return html`
		<s-top-controls>
		</s-top-controls>

		<section>
			<video id="video"
				width   =${ this.width }
				@touchstart=${ this.cameraZoom }
			>
				Video stream not available.
			</video>
		</section>

		<s-zoom-control>
			${ map(this.zoomButtonArr, (_, i) => html`
				<button
					data-zoom=${ i + 1 }
					class=${ classMap({ active: Math.round(this.currentZoom) === i + 1 }) }
					@click=${ this.onClickZoom }
				>${ i + 1 }</button>
			`) }
		</s-zoom-control>

		<s-actions>
			<slot name="action-start"></slot>

			<button
				@click=${ this.onClickButton }
			>
				<span>Take photo</span>
			</button>

			<slot name="action-end"></slot>
		</s-actions>
		`;
	}

	public static override styles = [ sharedStyles, cameraStyles ];

}


// These are polyfill types, as the official tslib don't have zoom as of june 2024.
declare global {
	interface MediaTrackConstraintSet {
		zoom?: number;
	}
	interface MediaTrackCapabilities {
		zoom?: {
			min:  number;
			max:  number;
			step: number;
		}
	}
	interface MediaTrackSettings {
		zoom?: number;
	}
}
