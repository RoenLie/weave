import { type AnalyzePhaseParams, type Plugin } from '@custom-elements-manifest/analyzer';
import { create, litPlugin, ts } from '@custom-elements-manifest/analyzer/src/browser-entrypoint.js';
import { readFileSync } from 'fs';

import { TagCatcher } from '../cache/create-tag-cache.js';


type Module = AnalyzePhaseParams['moduleDoc'];

export interface CreateManifestOptions {
	/**
	 * Run the analyze builder in dev mode.
	 * @default false
	 */
	dev?: boolean,
	/**
	 * Use ``custom-elements-manifest/analyzer`` plugins.
	 * Get more information about these plugins here:
	 *
	 * https://custom-elements-manifest.open-wc.org/analyzer/plugins/intro/
	 */
	plugins?: Plugin[],
}


const createModule = (path: string) => {
	const source = readFileSync(path).toString();

	return ts.createSourceFile(
		path,
		source,
		ts.ScriptTarget.ES2015,
		true,
	);
};

export const createManifest = (paths: string[], {
	dev = false,
	plugins = [],
}: CreateManifestOptions = {}) => {
	const modules = paths.map(createModule);

	plugins.push(...litPlugin(), litUsedTagsPlugin());

	return create({
		modules,
		plugins,
		dev,
	});
};


function litUsedTagsPlugin(): Plugin {
// Write a custom plugin
	return {
		// Make sure to always give your plugins a name, this helps when debugging
		name: 'lit-used-tags',
		// Runs for all modules in a project, before continuing to the analyzePhase
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		collectPhase({ ts, node, context }) {},
		// Runs for each module
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		analyzePhase({ ts, node, moduleDoc, context }) {
			if (ts.isClassDeclaration(node)) {
				const className = node.name?.getText() ?? '';
				const classDoc = getDeclarationDoc(moduleDoc, className);
				if (!classDoc)
					return;

				const componentText = node.getText();
				const tags = TagCatcher.get(componentText);

				(classDoc as any).dependencies = tags.map(tag => ({
					name: tag,
				}));
			}
		},
		// Runs for each module, after analyzing, all information about your module should now be available
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		moduleLinkPhase({ moduleDoc, context }) { },
		// Runs after modules have been parsed and after post-processing
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		packageLinkPhase({ customElementsManifest, context }) {},
	};
}

function getDeclarationDoc(moduleDoc: Module, name: string) {
	return moduleDoc.declarations?.find(x => x.name === name);
}
