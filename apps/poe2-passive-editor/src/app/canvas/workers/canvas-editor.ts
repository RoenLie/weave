import { CanvasWorkerEditor } from './editor-implementation.ts';


const host = new CanvasWorkerEditor();
onmessage = host.onmessage.bind(host);
