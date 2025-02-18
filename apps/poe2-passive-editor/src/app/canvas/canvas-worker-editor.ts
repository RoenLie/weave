import { CanvasWorkerEditor } from './canvas-worker-base.ts';


const host = new CanvasWorkerEditor();
onmessage = host.onmessage.bind(host);
