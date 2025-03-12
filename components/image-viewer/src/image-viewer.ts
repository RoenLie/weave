import { css, CustomElement, property, type CSSStyle } from '@roenlie/custom-element';
import { html } from 'lit-html';
import { createWorkerProxy, makeObjectTransferable, type TransferableWheelEvent, type WorkerApi } from './worker-interface.ts';
import { workerApiIn, type ImageWorkerApiIn, type ImageWorkerApiOut, type ImageWorkerApiOutImp } from './worker-api.ts';
import imageWorker from './image-worker.ts?worker';
import { resolvablePromise, type ResolvablePromise } from '@roenlie/core/async';


export class ImageViewer extends CustomElement implements ImageWorkerApiOutImp {

	static { this.register('iv-image-viewer'); }

	public static fps = 100;


	//#region properties
	protected worker:      Worker & WorkerApi<ImageWorkerApiIn>;
	protected workerReady: ResolvablePromise<boolean> = resolvablePromise();
	protected resizeObserver = new ResizeObserver(([ entry ]) => {
		if (!entry)
			return;

		const { width, height } = entry.contentRect;
		this.worker.setSize({ width, height });
	});
	//#endregion properties


	//#region public-api
	@property(String)  public accessor imageSrc: string = '';
	@property(Boolean) public accessor resetOnNewImage: boolean = false;
	@property(Boolean) public accessor fitOnNewImage: boolean = false;

	public api = {
		reset:     this.reset    .bind(this),
		fitToView: this.fitToView.bind(this),
		zoom:      this.zoom     .bind(this),
		rotate:    this.rotate   .bind(this),
	};
	//#endregion public-api


	//#region component-lifecycle
	protected override connectedCallback(): void {
		super.connectedCallback();

		this.tabIndex = 0;
	}

	protected override afterConnected(): void {
		this.initializeWorker();
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		this.worker.terminate();
	}

	protected override async beforeUpdate(changedProps: Set<string>): Promise<void> {
		super.beforeUpdate(changedProps);

		if (changedProps.has('imageSrc'))
			this.imageSrcUpdated();
	}
	//#endregion component-lifecycle


	//#region logic
	protected async initializeWorker(): Promise<void> {
		const canvas = this.shadowRoot!
			.getElementById('image-viewer') as HTMLCanvasElement | null;

		if (!canvas)
			throw new Error('Canvas not found in image viewer');

		this.worker = createWorkerProxy(imageWorker, workerApiIn);

		// The worker will send a message when it is ready
		this.worker.addEventListener('message', () => {
			this.workerReady.resolve(true);
		}, { once: true });

		// We wait for the worker to be ready before we start sending messages
		await this.workerReady;

		const offscreen = canvas.transferControlToOffscreen();
		this.worker.initialize({ canvas: offscreen }, [ offscreen ]);

		this.worker.addEventListener('message', (ev) => {
			if (ev.data.type === 'startViewMove')
				this.startViewMove(ev.data);
			else if (ev.data.type === 'startViewTouchMove')
				this.startViewTouchMove(ev.data);
		});

		// We observe the canvas for size changes\
		// this is done last to ensure we don't send messages before the worker is ready
		this.resizeObserver.observe(this);
	}

	protected async imageSrcUpdated() {
		await this.workerReady;

		if (!this.imageSrc)
			return this.worker.clearImage({});

		const imageResponse = await fetch(this.imageSrc!);
		const imageBlob = await imageResponse.blob();
		const imageBitmap = await createImageBitmap(imageBlob);

		this.worker.setImage({ image: imageBitmap }, [ imageBitmap ]);
	}

	protected reset() {
		this.worker.reset({});
	}

	protected fitToView() {
		this.worker.fitToView({});
	}

	protected zoom(factor: number) {
		this.worker.zoom({ factor });
	}

	protected rotate(degrees: number) {
		this.worker.rotate({ degrees });
	}
	//#endregion logic


	//#region event-handlers
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

	public startViewMove(data: ImageWorkerApiOut['startViewMove']['args']) {
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

	public startViewTouchMove(data: ImageWorkerApiOut['startViewTouchMove']['args']) {
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
	//#endregion event-handlers


	//#region template
	protected override render(): unknown {
		return html`
		<canvas
			id="image-viewer"
			@mousewheel=${ this.onMousewheel }
			@mousedown =${ this.onMousedown }
			@touchstart=${ this.onTouchstart }
		></canvas>
		`;
	}

	public static override styles: CSSStyle = css`
		:host {
			outline: none;
		}
	`;
	//#endregion template

}
