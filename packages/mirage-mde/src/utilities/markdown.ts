import { type marked } from 'marked';

import { MirageMDE } from '../mirage-mde.js';
import { addAnchorTargetBlank } from './add-anchor-target.js';


let renderer: typeof marked['parse'] | undefined;

// Only initialize the renderer once. This is done because Marked now apparently stores the uses and will
// Cause any walkTokens functions to run more and more.
const getRenderer = async (scope: MirageMDE) => {
	if (renderer)
		return renderer;

	const [
		marked,
		mangle,
		gfmHeadingId,
		markedHighlight,
		hljs,
		extendedTables,
	] = await Promise.all([
		import('marked').then(m => m.marked),
		import('marked-mangle').then(m => m.mangle),
		import('marked-gfm-heading-id').then(m => m.gfmHeadingId),
		import('marked-highlight').then(m => m.markedHighlight),
		import('highlight.js').then(m => m.default),
		//@ts-expect-error
		import('marked-extended-tables').then(m => m.default),
	]);

	const { renderingConfig } = scope.options;

	// Initialize
	const markedOptions = renderingConfig?.markedOptions ?? {};
	markedOptions.breaks = !(renderingConfig?.singleLineBreaks === false);
	markedOptions.gfm = false;

	if (renderingConfig?.codeSyntaxHighlighting === true) {
		marked.use(markedHighlight({
			langPrefix: 'language-',
			highlight(code: string, lang: string) {
				const language = hljs.getLanguage(lang) ? lang : 'plaintext';

				return hljs.highlight(code, { language }).value;
			},
		}));
	}

	// Set options
	marked.setOptions(markedOptions);

	// Mangle mailto links with HTML character references.
	marked.use(mangle());

	// Add ids to headings like GitHub.
	marked.use(gfmHeadingId());

	// Extends the standard Github-Flavored tables to support advanced features.
	// https://www.npmjs.com/package/marked-extended-tables
	marked.use(extendedTables());

	renderer = marked.parse;

	return renderer!;
};


/**
 * Default markdown render.
 */
export const markdown = async (scope: MirageMDE, text: string) => {
	const { renderingConfig } = scope.options;

	// Custom async replacement pipeline.
	for (const { regexp, replacer } of renderingConfig?.preprocessor ?? [])
		text = await replaceAsync(text, regexp, replacer);

	const renderer = await getRenderer(scope);

	// Convert the markdown to HTML
	let htmlText = await renderer(text);

	// Sanitize HTML
	if (typeof renderingConfig?.sanitizerFunction === 'function')
		htmlText = renderingConfig.sanitizerFunction(htmlText);

	// Edit the HTML anchors to add 'target="_blank"' by default.
	htmlText = addAnchorTargetBlank(htmlText);

	// Remove list-style when rendering checkboxes
	htmlText = removeListStyleWhenCheckbox(htmlText);

	return htmlText;
};


/**
 * Modify HTML to remove the list-style when rendering checkboxes.
 * @return The modified HTML text.
 */
export const removeListStyleWhenCheckbox = (htmlText: string): string => {
	const parser = new DOMParser();
	const htmlDoc = parser.parseFromString(htmlText, 'text/html');
	const listItems = htmlDoc.getElementsByTagName('li');

	for (const listItem of listItems) {
		for (const listItemChild of listItem.children) {
			if (listItemChild instanceof HTMLInputElement && listItemChild.type === 'checkbox') {
				// From Github: margin: 0 .2em .25em -1.6em;
				listItem.style.marginLeft = '-1.5em';
				listItem.style.listStyleType = 'none';
			}
		}
	}

	return htmlDoc.documentElement.innerHTML;
};


const replaceAsync = async (
	text: string,
	regexp: RegExp,
	replacerFunction: (...match: string[]) => string | Promise<string>,
) => {
	const replacements = await Promise.all(
		Array.from(text.matchAll(regexp),
			match => replacerFunction(...match)),
	);

	let i = 0;

	return text.replace(regexp, () => replacements[i++]!);
};
