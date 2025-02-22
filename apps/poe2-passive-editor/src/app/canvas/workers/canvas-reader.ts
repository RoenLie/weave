import { CanvasWorkerReader } from './reader-implementation.ts';


const host = new CanvasWorkerReader();
onmessage = host.onmessage.bind(host);
