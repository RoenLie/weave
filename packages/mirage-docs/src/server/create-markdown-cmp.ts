import { promises, readFileSync } from 'fs';
import { dirname, join, normalize, resolve } from 'path';

import { type Declarations } from '../shared/metadata.types.js';
import { getCache } from './build/cache/cache-registry.js';
import { TagCatcher } from './build/cache/create-tag-cache.js';
import { fileExt } from './build/helpers/is-dev-mode.js';
import { isEmptyObject } from './build/helpers/is-empty-object.js';
import { stringDedent } from './build/helpers/string-dedent.js';
import { toCamelCase } from './build/helpers/to-camel-case.js';
import { markdownIt } from './build/markdown/markdown-it.js';
import { docPageTemplate } from './generators/doc-page-template.js';


export class MarkdownComponentFactory {

	protected readonly projectRoot = resolve();
	protected readonly rootDepth: number;
	protected readonly tagCache: Map<string, string>;
	protected readonly manifestCache: Map<string, Declarations>;
	protected readonly path: string;
	protected imports: string[] = [];
	protected examples: Record<string, string> = {};
	protected metadata: Record<string, Declarations> = {};
	protected content = '';

	constructor(args: {
		path:          string,
		rootDepth:     number,
	}) {
		const cache = getCache();
		this.tagCache      = cache.tag;
		this.manifestCache = cache.manifest;

		this.path          = args.path;
		this.rootDepth     = args.rootDepth;
	}

	protected addUsedTags() {
		/* save the matching tags to a set, to avoid duplicates */
		const componentImportPaths = new Set<string>();

		/* loop through and cache paths for all custom element tags. */
		TagCatcher.get(this.content).forEach(tag => {
			const path = this.tagCache.get(tag);
			if (path)
				componentImportPaths.add(path);
		});

		const relativeComponentImports = [ ...componentImportPaths ]
			.map(path => '/..'.repeat(this.rootDepth) + path
				.replace(this.projectRoot, '')
				.replace(this.projectRoot.replaceAll('\\', '/'), ''));

		this.imports.push(...relativeComponentImports.map(f => `import '${ f }';`));
	}

	protected addHoistedImports() {
		/* remove hoist expressions and cache the desires imports to hoist. */
		const hoistExpression = /```typescript hoist\s+(.*?)```/gs;

		this.content = this.content.replace(hoistExpression, (_, hoist) => {
			this.imports.push((hoist + ';').replaceAll(';;', ';'));

			return '';
		});
	}

	protected addHeader() {
		/* extract the tag that requests component header, replace them with instances of docs component header */
		const headerExpression = /(\[component-header: *(.*?)])/g;
		const headerReplacement = (key: string) => stringDedent(`
		<div class="component-header">
			<midoc-page-header
				component-name="${ key }"
				.declaration=\${this.metadata['${ key }']}
			></midoc-page-header>
		</div>
		`);

		let hasHeader = false;

		this.content = this.content.replace(headerExpression, (val, expr, tag) => {
			hasHeader = true;
			if (this.manifestCache.has(tag))
				this.metadata[tag] = this.manifestCache.get(tag)!;

			return val.replace(expr, headerReplacement(tag));
		});

		if (hasHeader) {
			const importValue = `@roenlie/mirage-docs/app/components/page/page-header.${ fileExt() }`;
			this.imports.push(`import '${ importValue }';`);
		}
	}

	protected addMetadata() {
		/* extract the tags that request metadata, replace them with instances of the metadata viewer */
		const metadataExpression   = /(\[component-metadata: *(.*?)])/g;
		const metadataReplacement  = (key: string) => stringDedent(`
		<div class="component-metadata">
			<midoc-metadata-viewer
				.declaration=\${this.metadata['${ key }']}
			></midoc-metadata-viewer>
		</div>
		`);

		this.content = this.content.replaceAll(metadataExpression, (val, expr, tag) => {
			if (this.manifestCache.has(tag)) {
				this.metadata[tag] = this.manifestCache.get(tag)!;

				return val.replace(expr, metadataReplacement(tag));
			}

			return val.replace(expr, '');
		});

		/* Only import the metadata viewer component if it is being used. */
		if (!isEmptyObject(this.metadata)) {
			const importValue = `@roenlie/mirage-docs/app/components/page/metadata-viewer.${ fileExt() }`;
			this.imports.push(`import '${ importValue }';`);
		}
	}

	protected addEditors() {
		/* Mutate and inject the script editors */
		const exampleExpression = /<!--\s*Example:\s*((?:\w+\.)+js)\s*-->/gi;
		const exampleScriptExpr = /<script type="module" id="(\w+)">(.*?)<\/script>/gs;
		const exampleReplacement = (key: string) => stringDedent(`
		<div class="example">
			<docs-source-editor
				.source=\${this.examples['${ key }']}
				immediate
				auto-height
			></docs-source-editor>
		</div>`);

		this.content = this.content.replace(exampleExpression, (_, exampleFile: string) => {
			const exampleId      = toCamelCase(exampleFile);
			const examplePath    = normalize(join(dirname(this.path), exampleFile));
			const exampleContent = readFileSync(examplePath, { encoding: 'utf8' }).trim();

			this.examples[exampleId]  = exampleContent;

			return exampleReplacement(exampleId);
		});

		this.content = this.content.replace(exampleScriptExpr, (_, exampleId: string, exampleContent: string) => {
			this.examples[exampleId] = stringDedent(exampleContent);

			return exampleReplacement(exampleId);
		});

		/* only import the editor if it there are examples to be displayed. */
		if (!isEmptyObject(this.examples)) {
			const editorPath = `@roenlie/mirage-docs/app/components/page/source-editor.${ fileExt() }`;
			this.imports.push(`import '${ editorPath }';`);
		}
	}

	public create = async () => {
		this.content = await promises.readFile(this.path, { encoding: 'utf8' });

		this.addUsedTags();
		this.addHoistedImports();
		this.addHeader();
		this.addMetadata();
		this.addEditors();

		this.content = docPageTemplate({
			examples: JSON.stringify(this.examples, null, 3),
			metadata: JSON.stringify(this.metadata, null, 3),
			hoisted:  '',
			imports:  this.imports.join('\n'),
			markdown: markdownIt.render(this.content),
		});

		return this.content;
	};

}
