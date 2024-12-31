import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

import type { RequestHandler } from 'express';
import mime from 'mime';
import { parse } from 'node-html-parser';
import parseUrl from 'parseurl';
import ts from 'typescript';


export const tsCache: Map<string, string> = new Map();


export const tsStatic = (
	root: string, importmap: string, vendorPath: string, dev: boolean,
): RequestHandler => {
	if (!root)
		throw new TypeError('root path required');

	if (typeof root !== 'string')
		throw new TypeError('root path must be a string');

	return (async (req, res, next) => {
		if (req.method !== 'GET')
			return next();

		const originalUrl = parseUrl.original(req);
		let path = parseUrl(req)?.pathname ?? '';

		// make sure redirect occurs at mount
		if (path === '/' && originalUrl?.pathname?.substring(-1) !== '/')
			path = '';

		if (path.at(-1) === '/')
			path += 'index.html';

		if (!extname(path))
			path += '/index.html';

		// paths trying to go upwards are bad.
		if (path?.startsWith('..'))
			return res.sendStatus(404);

		let file: string | Buffer | undefined;
		let filePath: string = join(root, path);

		// Checking if the file exists simplifies later logic.
		if (!existsSync(filePath))
			return next();

		// We handle ts files up here, as the .ts mimetype does not exists.
		// Therefor we handle it here, then changed the path name to .js.
		// To get the correct mimetype, as the code is now transpiled to .js.
		if (path.endsWith('.ts')) {
			file = await handleTypescript(filePath, path);
			filePath = filePath.replace('.ts', '.js');
		}

		const type = mime.getType(filePath);
		if (!type)
			return res.sendStatus(500);

		const charset = mimeCharsets(type);
		res.setHeader(
			'Content-Type',
			type + (charset ? '; charset=' + charset : ''),
		);

		file ??= await (/\.(?:(?:ts)|(?:js)|(?:html))$/.test(filePath)
			? readFile(filePath, 'utf-8')
			: readFile(filePath));

		// Here we inject the importmap and hmr script
		if (typeof file === 'string' && filePath.endsWith('index.html'))
			file = handleIndexHtml(file as string, importmap, vendorPath, dev);

		return res.send(file);
	}) satisfies RequestHandler;
};


const handleTypescript = async (
	filePath: string,
	path: string,
): Promise<string> => {
	if (!tsCache.has(path)) {
		const content = await readFile(filePath, 'utf-8');

		const code = ts.transpile(content, {
			target:                  ts.ScriptTarget.ESNext,
			module:                  ts.ModuleKind.ESNext,
			moduleResolution:        ts.ModuleResolutionKind.Bundler,
			importHelpers:           true,
			experimentalDecorators:  true,
			emitDecoratorMetadata:   true,
			useDefineForClassFields: false,
		});

		tsCache.set(path, code);
	}

	return tsCache.get(path)!;
};


const handleIndexHtml = (
	file: string, importmap: string, vendorPath: string, dev: boolean,
) => {
	const dom = parse(file);
	const head = dom.querySelector('head')
		?? dom.insertAdjacentHTML(
			'afterbegin',
			'<head></head>',
		).querySelector('head')!;

	if (dev) {
		head.insertAdjacentHTML('beforeend',
			`<script type="module" src="${ vendorPath }/client-shims/hmr.ts"></script>`);
	}

	head.querySelector('script[type="importmap"]')
		?? head.insertAdjacentHTML('afterbegin',
			`<script id="importmap" type="importmap">${ importmap }</script>`)
			.querySelector('#importmap')!;

	return dom.toString();
};


const mimeCharsets = (mimeType: string, fallback?: string) => {
	// Assume text types are utf8
	return (/^text\/|^application\/(javascript|json)/)
		.test(mimeType) ? 'UTF-8' : fallback ?? '';
};
