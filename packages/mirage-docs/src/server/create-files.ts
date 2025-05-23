import { create, type Orama } from '@orama/orama';
import { defaultHtmlSchema, populate } from '@orama/plugin-parsedoc';
import { promises } from 'fs';
import { join, normalize, resolve } from 'path';

import { getCache } from './build/cache/cache-registry.js';
import { DocPath } from './build/helpers/docpath.js';
import type { InternalConfigProperties } from './config.js';
import { createEditorComponent } from './create-editor-cmp.js';
import { createIndexFile } from './create-index-file.js';
import { MarkdownComponentFactory } from './create-markdown-cmp.js';
import { siteConfigTemplate } from './generators/site-config-template.js';
import { tsconfigTemplate } from './generators/tsconfig-template.js';
import { typingsTemplate } from './generators/typings-template.js';


export const createDocFiles = async (props: InternalConfigProperties): Promise<{
	filesToCreate:          Map<string, string>;
	markdownComponentPaths: Set<string>;
	siteconfigImportPath:   string;
	oramaDb:                Orama<any, any, any, any>;
	absoluteRootDir:        string;
	absoluteSourceDir:      string;
	absoluteLibDir:         string;
}> => {
	const cache = getCache();
	const libDir = props.siteConfig.env.libDir;

	/** Holds the path and content that will be created. */
	const filesToCreate: Map<string, string> = new Map();

	const absoluteLibDir    = normalize(join(resolve(), props.root, libDir));
	const absoluteRootDir   = normalize(join(resolve(), props.root));
	const absoluteSourceDir = normalize(join(resolve(), props.source));

	const markdownAndEditorPaths = [
		...cache.markdown.values(),
		...cache.editor.values(),
	];

	const routes = markdownAndEditorPaths.map(path =>
		DocPath.createFileRoute(path, absoluteSourceDir));

	//#region create and populate orama search indexes.
	const oramaDb = create({
		schema: defaultHtmlSchema,
	}) as Orama<any, any, any, any>;

	await Promise.all(markdownAndEditorPaths.map(async path => {
		const content = await promises.readFile(path, { encoding: 'utf8' });
		const route = DocPath.createFileRoute(path, absoluteSourceDir);
		await populate(oramaDb, content, 'md', { basePath: route + ':' });
	}));
	//#endregion


	//#region create a tsconfig file for the cache folder.
	const tsconfigFilePath = join(absoluteLibDir, 'tsconfig.json');
	filesToCreate.set(tsconfigFilePath, tsconfigTemplate);
	//#endregion


	//#region create a d.ts file to make typescript happy inside the files.
	const typingsFilePath = join(absoluteLibDir, 'typings.d.ts');
	filesToCreate.set(typingsFilePath, typingsTemplate);
	//#endregion


	//#region create site config file
	const siteconfigFilePath = join(absoluteLibDir, 'siteconfig.ts');
	filesToCreate.set(siteconfigFilePath, siteConfigTemplate(props.siteConfig, routes));

	const normalizedSiteConfigPath = siteconfigFilePath
		.replace(absoluteRootDir, '').replace(/\\+/g, '/');
	//#endregion


	//#region create markdown routes
	// How many levels deep the docsite root is compared to project root.
	const rootDepth = props.root.split('/').filter(Boolean).length;
	const markdownComponentPaths: Set<string> = new Set();

	await Promise.all([ ...cache.markdown ].map(async ([ , path ]) => {
		const factory = new MarkdownComponentFactory({ path, rootDepth, siteConfig: props });

		const componentContent = await factory.create();
		const absoluteCmpPath = DocPath.createFileCachePath(
			path, absoluteSourceDir, absoluteLibDir, 'ts',
		);
		const normalizedCmpPath = absoluteCmpPath
			.replace(absoluteRootDir, '').replaceAll(/\\+/g, '/');

		filesToCreate.set(absoluteCmpPath, componentContent);

		markdownComponentPaths.add(absoluteCmpPath.replaceAll(/\\+/g, '/'));

		const absoluteIndexPath = DocPath.createFileCachePath(
			path, absoluteSourceDir, absoluteLibDir, 'html',
		);
		const content = createIndexFile(
			props.siteConfig.pages.styles,
			props.siteConfig.pages.scripts,
			normalizedCmpPath,
			normalizedSiteConfigPath,
		);
		filesToCreate.set(absoluteIndexPath, content);

		props.input?.push(absoluteIndexPath);
	}));
	//#endregion


	//#region create editor routes
	await Promise.all([ ...cache.editor ].map(async ([ , path ]) => {
		const componentPath = DocPath.createFileCachePath(
			path, absoluteSourceDir, absoluteLibDir, 'ts',
		).replace(absoluteRootDir, '');

		const componentContent = await createEditorComponent(
			componentPath.replaceAll(/\\+/g, '/'), path,
		);
		const absoluteCmpPath = DocPath.createFileCachePath(
			path, absoluteSourceDir, absoluteLibDir, 'ts',
		);
		const normalizedCmpPath = absoluteCmpPath
			.replace(absoluteRootDir, '').replace(/\\+/g, '/');

		filesToCreate.set(absoluteCmpPath, componentContent);

		const absoluteIndexPath = DocPath.createFileCachePath(
			path, absoluteSourceDir, absoluteLibDir, 'html',
		);
		const content = createIndexFile(
			props.siteConfig.pages.styles,
			props.siteConfig.pages.scripts,
			normalizedCmpPath,
			normalizedSiteConfigPath,
		);
		filesToCreate.set(absoluteIndexPath, content);

		props.input?.push(absoluteIndexPath);
	}));
	//#endregion


	return {
		filesToCreate,
		markdownComponentPaths,
		siteconfigImportPath: siteconfigFilePath
			.replace(absoluteRootDir, '')
			.replaceAll(/\\+/g, '/'),
		oramaDb,
		absoluteRootDir,
		absoluteSourceDir,
		absoluteLibDir,
	};
};
