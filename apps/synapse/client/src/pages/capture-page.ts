import { html, LitElement } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import capturePageStyles from './capture-page.css?raw';
import { when } from 'lit/directives/when.js';
import { stylesheet } from '../app/utils/as-cssstylesheet.ts';
import { classMap } from 'lit/directives/class-map.js';


@customElement('syn-capture-page')
export class CapturePageCmp extends LitElement {

	@query('#canvas') protected canvasEl: HTMLCanvasElement;
	@query('#camera') protected cameraEl: HTMLDivElement;
	@query('#video') protected videoEl:   HTMLVideoElement;
	@query('#photo') protected photoEl:   HTMLImageElement;
	@state() protected mode:              'camera' | 'gallery' = 'camera';
	@state() protected width = 0;    // We will scale the photo width to this
	@state() protected height = 0;     // This will be computed based on the input stream
	@state() protected displayedImgSrc = '';
	@state() protected streaming = false;
	protected video = null;
	protected canvas = null;
	protected photo = null;
	protected startbutton = null;

	public override connectedCallback(): void {
		super.connectedCallback();

		this.updateComplete.then(() => this.afterConnected());
	}

	protected async afterConnected() {
		this.width = this.offsetWidth;

		this.setCameraMode();
	}

	protected async setCameraMode() {
		this.mode = 'camera';

		return navigator.mediaDevices
			.getUserMedia({
				video: { facingMode: 'environment' },
				audio: false,
			}).then(stream => {
				this.videoEl.srcObject = stream;
				this.videoEl.play();
			}).catch(error => {
				console.error(`An error occurred: ${ error }`);
			});
	}

	protected onCanPlay() {
		if (this.streaming)
			return;

		this.streaming = true;
		this.height = (this.videoEl.videoHeight / this.videoEl.videoWidth) * this.width;
	}

	protected onClickButton(ev: Event) {
		ev.preventDefault();
		this.takepicture();
	}

	protected onClickBack(ev: Event) {
		ev.preventDefault();

		this.clearphoto();
		this.setCameraMode();
	}

	protected clearphoto() {
		const context = this.canvasEl.getContext('2d')!;
		context.fillStyle = '#AAA';
		context.fillRect(0, 0, this.canvasEl.width, this.canvasEl.height);

		const data = this.canvasEl.toDataURL('image/png');
		this.photoEl.setAttribute('src', data);
	}

	protected takepicture() {
		const context = this.canvasEl.getContext('2d')!;
		this.canvasEl.width = this.width;
		this.canvasEl.height = this.height;
		context.drawImage(this.videoEl, 0, 0, this.width, this.height);

		const data = this.canvasEl.toDataURL('image/png');
		this.displayedImgSrc = data;

		this.mode = 'gallery';

		const stream = this.videoEl.srcObject as MediaStream;
		stream.getVideoTracks().forEach(track => track.stop());
	}

	protected override render(): unknown {
		return html`
		<div id="camera" class=${ classMap({ hidden: this.mode !== 'camera' }) }>
			<video id="video"
				width   =${ this.width }
				@canplay=${ this.onCanPlay }
			>
			Video stream not available.
			</video>
			<button @click=${ this.onClickButton }>
				Take photo
			</button>
		</div>

		<div id="output" class=${ classMap({ hidden: this.mode !== 'gallery' }) }>
			<img id="photo"
				alt="The screen capture will appear in this box."
				.src=${ this.displayedImgSrc }
			>
			<button @click=${ this.onClickBack }>
				Back
			</button>
		</div>

		<canvas id="canvas"
			width =${ this.width }
			height=${ this.height }
		></canvas>
		`;
	}

	public static override styles = [ stylesheet(capturePageStyles) ];

}
