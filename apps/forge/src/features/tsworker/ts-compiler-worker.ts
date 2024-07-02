import { domId } from '@roenlie/mimic-core/dom';
import { ScriptTarget, transpile } from 'typescript';

import { ForgeFile, ForgeFileDB } from '../filesystem/forge-file.js';
import { MimicDB } from '../filesystem/mimic-db.js';


type Message = MessageEvent<{id: string; content: string;}>;


const importRegex = /import *(.*?)? *?(?:from)? *?["'](.*?)["'];/g;
let activeId = '';


self.onmessage = async (ev: Message) => {
	const { file, requestId } = await handleMessage(ev, activeId = domId());
	if (activeId === requestId)
		postMessage(file);
};


const handleMessage = async (ev: Message, requestId: string) => {
	const { id, content } = ev.data;

	const code = content.replaceAll(importRegex, (str, imports, from) =>
		str.replace(from, from.replace(/^\/+/, ''))).trim();

	const transpiledCode = transpile(code ?? '', {
		target:                 ScriptTarget.ESNext,
		experimentalDecorators: true,
	});

	// After transpiling, we get the current file, and update its content and javascript entries.
	const collection = MimicDB.connect(ForgeFileDB).collection(ForgeFile);
	const file = (await collection.get(id))!;
	const encodedJs = encodeURIComponent(transpiledCode);
	const dataUri = 'data:text/javascript;charset=utf-8,' + encodedJs;

	if (file.content !== content) {
		file.importAlias = file.path.replace(/^\/+/, '');
		file.importUri = dataUri;
		file.content = content;

		await collection.put(file);
	}

	return { file, requestId };
};
