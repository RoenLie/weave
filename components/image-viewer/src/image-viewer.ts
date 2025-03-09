import { css, CustomElement, property, type CSSStyle } from '@roenlie/custom-element';
import { html } from 'lit-html';
import { createWorkerProxy, makeObjectTransferable, type TransferableWheelEvent, type WorkerApi } from './worker-interface.ts';
import { workerApiIn, type ImageWorkerApiIn, type ImageWorkerApiOut } from './worker-api.ts';
import imageWorker from './image-worker.ts?worker';


export class ImageViewer extends CustomElement {

	static { this.register('iv-image-viewer'); }

	public static fps = 100;

	@property() public accessor imagesrc: string | undefined;

	protected worker: Worker & WorkerApi<ImageWorkerApiIn>;

	protected resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		const { width, height } = entry.contentRect;
		this.worker.setSize({ width, height });
	});

	protected override connectedCallback(): void {
		super.connectedCallback();

		this.tabIndex = 0;
	}

	protected override afterConnected(): void {
		const canvas = this.shadowRoot!
			.getElementById('image-viewer') as HTMLCanvasElement | null;

		if (!canvas)
			throw new Error('Canvas not found in image viewer');

		this.resizeObserver.observe(this);

		this.worker = createWorkerProxy(imageWorker, workerApiIn);

		this.worker.addEventListener('message', (ev) => {
			if (ev.data.type === 'startViewMove')
				this.onStartViewMove(ev.data);
			else if (ev.data.type === 'startViewTouchMove')
				this.onStartViewTouchMove(ev.data);
		});

		const offscreen = canvas.transferControlToOffscreen();
		this.worker.initialize({ canvas: offscreen }, [ offscreen ]);
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.worker.terminate();
	}

	protected override async beforeUpdate(changedProps: Set<string>): Promise<void> {
		super.beforeUpdate(changedProps);

		if (changedProps.has('imagesrc')) {
			const imageResponse = await fetch(this.imagesrc!);
			const imageBlob = await imageResponse.blob();
			const imageBitmap = await createImageBitmap(imageBlob);

			this.worker.setImage({ image: imageBitmap }, [ imageBitmap ]);
		}
	}

	protected onMousedown(downEv: MouseEvent) {
		if (downEv.buttons !== 1)
			return;

		downEv.preventDefault();
		this.focus();

		const event = makeObjectTransferable(downEv);
		this.worker.mousedown({ event });
	}

	protected onTouchstart(downEv: TouchEvent) {
		downEv.preventDefault();
		this.focus();

		const event = makeObjectTransferable(downEv);
		const touches = [ ...downEv.touches ].map(touch => makeObjectTransferable(touch));
		const rect = this.getBoundingClientRect();

		this.worker.touchstart({ event, touches, rect });
	}

	protected onMousewheel = (() => {
		let lastFrameTime: number = performance.now();
		let event: TransferableWheelEvent = undefined as any;

		const fn = (currentTime: number) => {
			const deltaTime = currentTime - lastFrameTime;
			if (deltaTime < 1000 / ImageViewer.fps)
				return;

			lastFrameTime = currentTime;
			const vec = { x: event.offsetX, y: event.offsetY };
			const deltaY = event.deltaY;
			const factor = -deltaY > 0 ? 1.1 : 1 / 1.1;
			this.worker.scaleAt({ vec, factor });
		};

		return (ev: WheelEvent) => {
			event = makeObjectTransferable(ev);
			requestAnimationFrame(fn);
		};
	})();

	protected onStartViewMove(data: ImageWorkerApiOut['startViewMove']['args']) {
		const rect = this.getBoundingClientRect();

		// We setup the mousemove and mouseup events for panning the view
		const mousemove = (() => {
			let ev: MouseEvent = undefined as any;
			let lastFrameTime: number = performance.now();

			const fn = (currentTime: number) => {
				const deltaTime = currentTime - lastFrameTime;
				if (deltaTime < 1000 / ImageViewer.fps)
					return;

				lastFrameTime = currentTime;
				const x = ev.offsetX - rect.x - data.offsetX;
				const y = ev.offsetY - rect.y - data.offsetY;

				this.worker.moveTo({ x, y });
			};

			return (event: MouseEvent) => {
				ev = event; requestAnimationFrame(fn);
			};
		})();
		const mouseup = () => {
			removeEventListener('mousemove', mousemove);
			removeEventListener('mouseup', mouseup);
		};
		addEventListener('mousemove', mousemove);
		addEventListener('mouseup', mouseup);
	};

	protected onStartViewTouchMove(data: ImageWorkerApiOut['startViewTouchMove']['args']) {
		const rect = this.getBoundingClientRect();

		const getDistance = (touch1: Touch, touch2: Touch) => {
			const dx = touch2.clientX - touch1.clientX;
			const dy = touch2.clientY - touch1.clientY;

			return Math.sqrt(dx * dx + dy * dy);
		};

		let initialDistance: number | undefined;

		// We setup the mousemove and mouseup events for panning the view
		const touchmove = (() => {
			let ev: TouchEvent = undefined as any;
			let lastFrameTime: number = performance.now();

			const fn = (currentTime: number) => {
				const deltaTime = currentTime - lastFrameTime;
				if (deltaTime < 1000 / ImageViewer.fps)
					return;

				lastFrameTime = currentTime;

				const touch1 = ev.touches[0];
				if (!touch1)
					return touchend(ev);

				// For touch we also need to find out if we are zooming or moving
				if (ev.touches.length === 2) {
					const touch2 = ev.touches[1]!;

					if (initialDistance === undefined)
						initialDistance = getDistance(touch1, touch2);

					const currentDistance = getDistance(touch1, touch2);
					const factor = currentDistance / initialDistance;

					initialDistance = currentDistance;

					const touch1OffsetX = touch1.pageX - rect.x;
					const touch1OffsetY = touch1.pageY - rect.y;
					const touch2OffsetX = touch2.pageX - rect.x;
					const touch2OffsetY = touch2.pageY - rect.y;

					const x = (touch1OffsetX + touch2OffsetX) / 2;
					const y = (touch1OffsetY + touch2OffsetY) / 2;

					this.worker.scaleAt({ vec: { x, y }, factor });
				}
				else {
					const x = touch1.clientX - rect.x - data.offsetX;
					const y = touch1.clientY - rect.y - data.offsetY;

					this.worker.moveTo({ x, y });
				}
			};

			return (event: TouchEvent) => {
				ev = event; requestAnimationFrame(fn);
			};
		})();
		const touchend = (_event: TouchEvent) => {
			removeEventListener('touchmove', touchmove);
			removeEventListener('touchstart', touchend);
			removeEventListener('touchend', touchend);
		};

		addEventListener('touchmove', touchmove);
		addEventListener('touchstart', touchend);
		addEventListener('touchend', touchend);
	}

	protected override render(): unknown {
		return html`
		<canvas
			id="image-viewer"
			@mousewheel=${ this.onMousewheel }
			@mousedown =${ this.onMousedown }
			@touchstart=${ this.onTouchstart }
		></canvas>
		<button @click=${ () => this.worker.reset({}) }>
			Reset
		</button>
		<button @click=${ () => this.worker.fitToView({}) }>
			Fit to view
		</button>
		<button @click=${ () => this.worker.zoom({ factor: 1.1 }) }>
			Zoom in
		</button>
		<button @click=${ () => this.worker.zoom({ factor: 1 / 1.1 }) }>
			Zoom out
		</button>
		<button @click=${ () => this.worker.rotate({ degrees: 90 }) }>
			rotate left
		</button>
		<button @click=${ () => this.worker.rotate({ degrees: -90 }) }>
			rotate right
		</button>
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			outline: none;
		}
	`;

}
