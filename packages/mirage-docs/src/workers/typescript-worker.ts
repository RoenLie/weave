import { ScriptTarget, transpile } from 'typescript';


(async () => {
	self.onmessage = (ev: MessageEvent<string>) => {
		const transpiledCode = transpile(ev.data ?? '', { target: ScriptTarget.ESNext });
		postMessage(transpiledCode);
	};
})();
