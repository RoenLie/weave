import { type EditorView } from '@codemirror/view';
import { type stringliteral } from '@roenlie/mimic-core/types';

import { cleanBlock } from '../codemirror/commands/clean-block.js';
import { drawHorizontalRule } from '../codemirror/commands/draw-horizontal-rule.js';
import { drawImage } from '../codemirror/commands/draw-image.js';
import { drawLink } from '../codemirror/commands/draw-link.js';
import { drawTable } from '../codemirror/commands/draw-table.js';
import { drawUploadedImage } from '../codemirror/commands/draw-uploaded-image.js';
import { redo, undo } from '../codemirror/commands/history.js';
import { popoutPreview } from '../codemirror/commands/popout-preview.js';
import { toggleCodeBlock } from '../codemirror/commands/toggle-codeblock.js';
import { toggleFullScreen } from '../codemirror/commands/toggle-fullscreen.js';
import { toggleHeading } from '../codemirror/commands/toggle-heading.js';
import { toggleOrderedList, toggleUnorderedList } from '../codemirror/commands/toggle-list.js';
import { togglePreview } from '../codemirror/commands/toggle-preview.js';
import { toggleQuote } from '../codemirror/commands/toggle-quote.js';
import { toggleSideBySide } from '../codemirror/commands/toggle-sidebyside.js';
import { toggleBold, toggleItalic, toggleStrikethrough } from '../codemirror/commands/toggle-text-marker.js';
import { type Marker } from '../codemirror/listeners/get-state.js';
import { type MirageMDE } from '../mirage-mde.js';


export type MMDECommand = (target: EditorView, scope: MirageMDE) => boolean

export type ToolbarItem = ToolbarSeparator | ToolbarButton | ToolbarDropdown;

export interface ToolbarButtonBase {
	name: stringliteral | BuiltInAction;
	iconUrl?: string;
	title?: string;
	shortcut?: string;
	global?: boolean;
	noDisable?: boolean;
	noMobile?: boolean;
}

export interface ToolbarDropdown extends ToolbarButtonBase {
	type: 'dropdown';
	children: (stringliteral | BuiltInAction)[];
}

export interface ToolbarButton extends ToolbarButtonBase {
	type: 'button';
	action?: string | MMDECommand;
	text?: string;
	marker?: Marker[];
}

export interface ToolbarSeparator {
	type: 'separator';
}

export type BuiltInAction = [
	'bold',
	'italic',
	'strikethrough',
	'heading',
	'heading-bigger',
	'heading-smaller',
	'heading-1',
	'heading-2',
	'heading-3',
	'code',
	'quote',
	'ordered-list',
	'unordered-list',
	'clean-block',
	'link',
	'image',
	'upload-image',
	'table',
	'horizontal-rule',
	'preview',
	'side-by-side',
	'fullscreen',
	'popout',
	'guide',
	'undo',
	'redo',
	'separator',
	'separator-1',
	'separator-2',
	'separator-3',
	'separator-4',
	'separator-5',
	'separator-6',
][number]


export const defaultToolbar: BuiltInAction[] = [
	'bold',
	'italic',
	'strikethrough',
	'separator-1',
	'heading',
	'heading-bigger',
	'heading-smaller',
	'heading-1',
	'heading-2',
	'heading-3',
	'separator-2',
	'code',
	'quote',
	'ordered-list',
	'unordered-list',
	'clean-block',
	'separator-3',
	'link',
	'image',
	'upload-image',
	'table',
	'horizontal-rule',
	'separator-4',
	'preview',
	'side-by-side',
	'fullscreen',
	'popout',
	'separator-5',
	'undo',
	'redo',
	'separator-6',
	'guide',
];


export const builtInActions: [stringliteral | BuiltInAction, ToolbarItem][] = [
	[ 'separator',   { type: 'separator' } ],
	[ 'separator-1', { type: 'separator' } ],
	[ 'separator-2', { type: 'separator' } ],
	[ 'separator-3', { type: 'separator' } ],
	[ 'separator-4', { type: 'separator' } ],
	[ 'separator-5', { type: 'separator' } ],
	[ 'separator-6', { type: 'separator' } ],
	[
		'bold', {
			type:     'button',
			name:     'bold',
			action:   toggleBold,
			shortcut: 'c-b',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-bold.svg',
			title:    'Bold',
			marker:   [ 'bold' ],
		},
	],
	[
		'italic', {
			type:     'button',
			name:     'italic',
			action:   toggleItalic,
			shortcut: 'c-i',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-italic.svg',
			title:    'Italic',
			marker:   [ 'italic' ],
		},
	],
	[
		'strikethrough', {
			type:     'button',
			name:     'strikethrough',
			action:   toggleStrikethrough,
			shortcut: 'c-u',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-strikethrough.svg',
			title:    'Strikethrough',
			marker:   [ 'strikethrough' ],
		},
	],
	[
		'heading', {
			type:    'button',
			name:    'heading',
			action:  (view) => toggleHeading(view, { direction: 'smaller' }),
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/type.svg',
			title:   'Heading',
			marker:  [ 'H1', 'H2', 'H3', 'H4', 'H5', 'H6' ],
		},
	],
	[
		'heading-bigger', {
			type:     'button',
			name:     'heading-bigger',
			action:   (view) => toggleHeading(view, { direction: 'bigger' }),
			shortcut: 'Shift-Cmd-H',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/arrow-up-short.svg',
			title:    'Bigger Heading',
		},
	],
	[
		'heading-smaller', {
			type:     'button',
			name:     'heading-smaller',
			action:   (view) => toggleHeading(view, { direction: 'smaller' }),
			shortcut: 'Cmd-H',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/arrow-down-short.svg',
			title:    'Smaller Heading',
		},
	],
	[
		'heading-1', {
			type:     'button',
			name:     'heading-1',
			action:   (view) => toggleHeading(view, { size: 1 }),
			shortcut: 'c-1',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-h1.svg',
			title:    'H1 heading',
			marker:   [ 'H1' ],
		},
	],
	[
		'heading-2', {
			type:     'button',
			name:     'heading-2',
			action:   (view) => toggleHeading(view, { size: 2 }),
			shortcut: 'c-2',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-h2.svg',
			title:    'H2 heading',
			marker:   [ 'H2' ],
		},
	],
	[
		'heading-3', {
			type:     'button',
			name:     'heading-3',
			action:   (view) => toggleHeading(view, { size: 3 }),
			shortcut: 'c-3',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-h3.svg',
			title:    'H3 heading',
			marker:   [ 'H3' ],
		},
	],
	[
		'heading-4', {
			type:     'button',
			name:     'heading-4',
			action:   (view) => toggleHeading(view, { size: 4 }),
			shortcut: 'c-4',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-h1.svg',
			title:    'H4 heading',
			marker:   [ 'H4' ],
		},
	],
	[
		'heading-5', {
			type:     'button',
			name:     'heading-5',
			action:   (view) => toggleHeading(view, { size: 5 }),
			shortcut: 'c-5',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-h2.svg',
			title:    'H5 heading',
			marker:   [ 'H5' ],
		},
	],
	[
		'heading-6', {
			type:     'button',
			name:     'heading-6',
			action:   (view) => toggleHeading(view, { size: 6 }),
			shortcut: 'c-6',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/type-h3.svg',
			title:    'H6 heading',
			marker:   [ 'H6' ],
		},
	],
	[
		'code', {
			type:     'button',
			name:     'code',
			action:   toggleCodeBlock,
			shortcut: 'Cmd-Alt-C',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/code.svg',
			title:    'Code',
		},
	],
	[
		'quote', {
			type:     'button',
			name:     'quote',
			action:   toggleQuote,
			shortcut: 'Cmd-\'',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/quote.svg',
			title:    'Quote',
		},
	],
	[
		'ordered-list', {
			type:     'button',
			name:     'ordered-list',
			action:   toggleOrderedList,
			shortcut: 'Cmd-Alt-L',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/list-ol.svg',
			title:    'Numbered List',
			marker:   [ 'ordered-list' ],
		},
	],
	[
		'unordered-list', {
			type:     'button',
			name:     'unordered-list',
			action:   toggleUnorderedList,
			shortcut: 'Cmd-L',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/list-ul.svg',
			title:    'Generic List',
			marker:   [ 'unordered-list' ],
		},
	],
	[
		'clean-block', {
			type:     'button',
			name:     'clean-block',
			action:   cleanBlock,
			shortcut: 'Cmd-E',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/eraser.svg',
			title:    'Clean block',
		},
	],
	[
		'link', {
			type:     'button',
			name:     'link',
			action:   drawLink,
			shortcut: 'Cmd-K',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/link.svg',
			title:    'Create Link',
		},
	],
	[
		'image', {
			type:     'button',
			name:     'image',
			action:   drawImage,
			shortcut: 'Cmd-Alt-I',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/image.svg',
			title:    'Insert Image',
		},
	],
	[
		'upload-image', {
			type:    'button',
			name:    'upload-image',
			action:  drawUploadedImage,
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/cloud-arrow-up.svg',
			title:   'Import an image',
		},
	],
	[
		'table', {
			type:    'button',
			name:    'table',
			action:  drawTable,
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/table.svg',
			title:   'Insert Table',
		},
	],
	[
		'horizontal-rule', {
			type:    'button',
			name:    'horizontal-rule',
			action:  drawHorizontalRule,
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/dash-lg.svg',
			title:   'Insert Horizontal Line',
		},
	],
	[
		'preview', {
			type:      'button',
			name:      'preview',
			action:    togglePreview,
			shortcut:  'c-p',
			global:    true,
			iconUrl:   'https://icons.getbootstrap.com/assets/icons/eye.svg',
			noDisable: true,
			title:     'Toggle Preview',
		},
	],
	[
		'side-by-side', {
			type:     'button',
			name:     'side-by-side',
			action:   toggleSideBySide,
			shortcut: 'F9',
			iconUrl:  'https://icons.getbootstrap.com/assets/icons/layout-sidebar-inset-reverse.svg',
			title:    'Toggle Side by Side',
			noMobile: true,
		},
	],
	[
		'fullscreen', {
			type:      'button',
			name:      'fullscreen',
			action:    toggleFullScreen,
			shortcut:  'F11',
			iconUrl:   'https://icons.getbootstrap.com/assets/icons/fullscreen.svg',
			title:     'Toggle Fullscreen',
			noDisable: true,
			noMobile:  true,
		},
	],
	[
		'popout', {
			type:    'button',
			name:    'popout',
			action:  popoutPreview,
			title:   'Open preview in external window',
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/box-arrow-up-right.svg',
		},
	],
	[
		'undo', {
			type:    'button',
			name:    'undo',
			action:  undo,
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/arrow-counterclockwise.svg',
			title:   'Undo',
		},
	],
	[
		'redo', {
			type:    'button',
			name:    'redo',
			action:  redo,
			iconUrl: 'https://icons.getbootstrap.com/assets/icons/arrow-clockwise.svg',
			title:   'Redo',
		},
	],
	[
		'guide', {
			type:      'button',
			name:      'guide',
			action:    'https://www.markdownguide.org/basic-syntax/',
			iconUrl:   'https://icons.getbootstrap.com/assets/icons/question-circle.svg',
			title:     'Markdown Guide',
			noDisable: true,
		},
	],
];
