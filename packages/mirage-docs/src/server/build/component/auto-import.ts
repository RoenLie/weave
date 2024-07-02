import Fs from 'node:fs';

import { type AutoImportLoadProps } from './auto-import.types.js';


export const componentAutoImportLoad = (props: AutoImportLoadProps) => {
	const {
		id,
		config,
		tagCache,
		tagPrefixes,
		loadWhitelist,
		loadBlacklist,
		tagCaptureExpr = /<\/([\w-]+)>/g,
	} = props;

	const whitelisted = loadWhitelist?.some(reg => reg.test(id)) ?? true;
	const blacklisted = loadBlacklist?.some(reg => reg.test(id)) ?? false;
	if (!whitelisted || blacklisted)
		return;

	if (!Fs.existsSync(id))
		return;

	let code = Fs.readFileSync(id, { encoding: 'utf8' });

	/* save the matching tags to a set, to avoid duplicates */
	const tagsUsed = new Set<string>();

	/* loop through all tags that match the capture expression. */
	code.replaceAll(tagCaptureExpr, (val, tag) => {
		/* loop through all given tag prefixes and add the matches to set. */
		tagPrefixes.forEach(pref => tag.startsWith(pref) && tagsUsed.add(tag));

		/* return the full value here as we don't want to change anything. */
		return val;
	});

	/* if there are no tags used, exit out. */
	if (!tagsUsed.size)
		return;

	/* for each tag, create an import statement that uses the previously cached component path. */
	const imports = Array.from(tagsUsed)
		.filter(tag => tagCache.has(tag))
		.map(tag => `import '${ tagCache.get(tag)
			?.replaceAll('\\', '/')
			.replace(config.root, '')
			.replace('.ts', '.js')
		}';`);


	const msg = `/* Component imports injected from: vite-plugin-component-auto-import */`;
	imports.unshift(msg);
	imports.push(`/*  */`);

	code = imports.join('\n') + '\n' + code;

	return code;

	/* Doing this so early confuses chrome debugger breakpoints,
	just return the code and let vite handle it from there. */
	//const tsFile = Path.parse(id).name + '.ts';
	//return transformWithEsbuild(code, tsFile, { sourcemap: true });
};
