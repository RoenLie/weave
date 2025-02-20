import type { CanvasEditorWorkerApiIn, CanvasReaderWorkerApiIn } from './canvas-worker-base.ts';


type CanvasReaderWorkerMethods = {
	[key in keyof CanvasReaderWorkerApiIn]: (data: Omit<CanvasReaderWorkerApiIn[key], 'type'>) => void;
} & {
	init: (bg: HTMLCanvasElement, main: HTMLCanvasElement) => void;
};


export const createCanvasReaderWorker = (ctor: new() => Worker): Worker & CanvasReaderWorkerMethods => {
	const proxy = new Proxy(new ctor(), {
		get(target: Worker & Record<keyof any, any>, p, receiver) {
			if (typeof target[p] === 'function')
				return target[p].bind(target);

			if (p === 'init') {
				return (bgCanvas: HTMLCanvasElement, mainCanvas: HTMLCanvasElement) => {
					const bgOffscreen = bgCanvas.transferControlToOffscreen();
					const mainOffscreen = mainCanvas.transferControlToOffscreen();

					target.postMessage(
						{ type: 'init', bg: bgOffscreen, main: mainOffscreen },
						[ bgOffscreen, mainOffscreen ],
					);
				};
			}

			if (!Reflect.has(target, p)) {
				return (args: any) => {
					target.postMessage({
						...args,
						type: p,
					});
				};
			}

			return Reflect.get(target, p, receiver);
		},
	});

	return proxy as Worker & CanvasReaderWorkerMethods;
};


type CanvasEditorWorkerMethods = {
	[key in keyof CanvasEditorWorkerApiIn]: (data: Omit<CanvasEditorWorkerApiIn[key], 'type'>) => void;
} & {
	init: (bg: HTMLCanvasElement, main: HTMLCanvasElement) => void;
};


export const createCanvasEditorWorker = (ctor: new() => Worker): Worker & CanvasEditorWorkerMethods => {
	const proxy = new Proxy(new ctor(), {
		get(target: Worker & Record<keyof any, any>, p, receiver) {
			if (typeof target[p] === 'function')
				return target[p].bind(target);

			if (p === 'init') {
				return (bgCanvas: HTMLCanvasElement, mainCanvas: HTMLCanvasElement) => {
					const bgOffscreen = bgCanvas.transferControlToOffscreen();
					const mainOffscreen = mainCanvas.transferControlToOffscreen();

					target.postMessage(
						{ type: 'init', bg: bgOffscreen, main: mainOffscreen },
						[ bgOffscreen, mainOffscreen ],
					);
				};
			}

			if (!Reflect.has(target, p)) {
				return (args: any) => {
					target.postMessage({
						...args,
						type: p,
					});
				};
			}

			return Reflect.get(target, p, receiver);
		},
	});

	return proxy as Worker & CanvasEditorWorkerMethods;
};
