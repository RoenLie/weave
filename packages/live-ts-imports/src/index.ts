import type { Server as HTTPServer } from 'node:http';
import type { Server as HTTPSServer } from 'node:https';
import { join, resolve } from 'node:path';

import chokidar from 'chokidar';
import type express from 'express';
import { WebSocketServer } from 'ws';

import { createClientSymlinks } from './create-client-symlinks.js';
import { createImportMap } from './create-import-map.js';
import { tsCache, tsStatic } from './custom-serve-static.js';
import { getPkgDepsMap } from './resolve-pkg-deps.js';


export interface LiveTsImportsConfig {
	importMeta:  ImportMeta;
	server:      HTTPServer | HTTPSServer;
	app:         express.Express;
	packages:    string[];
	client?:     { path: string, dir: string }[];
	vendorDir?:  string;
	clientPath?: string;
	vendorPath?: string;
	dev?:        boolean;
}


export const liveTsImports = (config: LiveTsImportsConfig) => {
	const {
		app,
		server,
		importMeta,
		vendorPath = '/vendor',
		dev = true,
	} = config;

	let {
		client = [ { path: '/', dir: 'client' } ],
		vendorDir = '_vendor',
		packages,
	} = config;

	packages = [ 'tslib', ...packages ];
	vendorDir = join(resolve(), 'node_modules', vendorDir);
	client = client.map(c => ({ path: c.path, dir: join(resolve(), c.dir) }));

	const pkgDepsMap = getPkgDepsMap(importMeta, packages);

	createClientSymlinks(vendorDir, pkgDepsMap, dev);

	const importmap = createImportMap(vendorPath, pkgDepsMap, dev);

	client.forEach(({ path, dir }) => {
		app.use(path, tsStatic(dir, importmap, vendorPath, dev));
	});

	app.use(vendorPath, tsStatic(vendorDir, importmap, vendorPath, dev));

	const wss = new WebSocketServer({ server });

	if (dev) {
		chokidar.watch(client.map(({ dir }) => dir)).on('all', () => {
			tsCache.clear();
			wss.clients.forEach((socket) => socket.send('reload'));
		});
	}

	return {
		wss,
	};
};
