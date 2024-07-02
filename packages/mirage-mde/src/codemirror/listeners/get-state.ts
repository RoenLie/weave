import { syntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { isRangeInRanges, type Range } from '@roenlie/mimic-core/validation';


export type Marker = TextMarker | LineMarker | [
	'link',
	'image',
	'fencedcode'
][number];


export type TextMarker = [
	'bold',
	'italic',
	'strikethrough'
][number];


export type LineMarker = [
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'blockquote',
	'quotemark',
	'listmark',
	'ordered-list',
	'unordered-list',
][number];


const markerMap: Record<string, Marker> = {
	StrongEmphasis: 'bold',
	Emphasis:       'italic',
	Strikethrough:  'strikethrough',
	OrderedList:    'ordered-list',
	BulletList:     'unordered-list',
	ListMark:       'listmark',
	ATXHeading1:    'H1',
	ATXHeading2:    'H2',
	ATXHeading3:    'H3',
	ATXHeading4:    'H4',
	ATXHeading5:    'H5',
	ATXHeading6:    'H6',
	Link:           'link',
	Image:          'image',
	Blockquote:     'blockquote',
	QuoteMark:      'quotemark',
	FencedCode:     'fencedcode',
};


export const textMarkerValue: Record<TextMarker, string> = {
	bold:          '**',
	italic:        '*',
	strikethrough: '~~',
};


export const lineMarkerValue: Record<LineMarker, string> = {
	'ordered-list':   '* ',
	'unordered-list': '1. ',
	'listmark':       '',
	'blockquote':     '> ',
	'quotemark':      '>',
	'H1':             '# ',
	'H2':             '## ',
	'H3':             '### ',
	'H4':             '#### ',
	'H5':             '##### ',
	'H6':             '###### ',
};


export const getNodesInRange = (state: EditorState, range: Range) => {
	const activeSymbols: ({
		marker: Marker,
		from: number;
		to: number;
		name: string;
	})[] = [];

	syntaxTree(state).iterate({
		enter: ({ node }) => {
			if (!isRangeInRanges([ { from: node.from, to: node.to } ], range))
				return;

			const name = markerMap[node.name];
			if (!name)
				return;

			activeSymbols.push({
				marker: name,
				name:   node.name,
				from:   node.from,
				to:     node.to,
			});
		},
	});

	return activeSymbols;
};


export const getAllNodesInRange = (state: EditorState, range: Range) => {
	const activeSymbols: ({
		from: number;
		to: number;
		name: string;
	})[] = [];

	syntaxTree(state).iterate({
		enter: ({ node }) => {
			if (!isRangeInRanges([ { from: node.from, to: node.to } ], range))
				return;

			activeSymbols.push({
				name: node.name,
				from: node.from,
				to:   node.to,
			});
		},
	});

	return activeSymbols;
};
