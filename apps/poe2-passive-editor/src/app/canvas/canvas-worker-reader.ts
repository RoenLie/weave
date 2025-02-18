import { CanvasWorkerReader } from './canvas-worker-base.ts';


const host = new CanvasWorkerReader();
onmessage = host.onmessage.bind(host);
