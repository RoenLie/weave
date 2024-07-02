import { type Extension } from '@codemirror/state';
import { type stringliteral } from '@roenlie/mimic-core/types';
import { type LitElement } from 'lit';
import { marked, type MarkedOptions } from 'marked';

import type {
	BuiltInAction,
	ToolbarButton,
	ToolbarDropdown,
} from './registry/action-registry.js';
import { type BuildInStatus, type StatusBarItem } from './registry/status-registry.js';


export interface TimeFormatOptions {
	locale?: string | string[];
	format?: Intl.DateTimeFormatOptions;
}

export interface AutoSaveOptions {
	enabled: boolean;
	uniqueId: string;
	delay?: number;
	submit_delay?: number;
	text?: string;
	timeFormat?: TimeFormatOptions;
	foundSavedValue?: boolean;
	bound?: boolean;
	loaded?: boolean;
}

export interface BlockStyleOptions {
	bold?: string;
	code?: string;
	italic?: string;
}

export interface ParsingOptions {
	name?: string;
	allowAtxHeaderWithoutSpace?: boolean;
	strikethrough?: boolean;
	underscoresBreakWords?: boolean;
	gitHubSpice?: boolean;
	highlightFormatting?: boolean;
}

export interface PromptTexts {
	image?: string;
	link?: string;
}

export interface RenderingOptions {
	codeSyntaxHighlighting?: boolean;
	markedOptions?: MarkedOptions;
	sanitizerFunction?: (html: string) => string;
	singleLineBreaks?: boolean;
	preprocessor?: {
		regexp: RegExp,
		replacer: (...match: string[]) => string | Promise<string>;
	}[]
}

export interface ImageTextsOptions {
	sbInit?: string;
	sbOnDragEnter?: string;
	sbOnDrop?: string;
	sbProgress?: string;
	sbOnUploaded?: string;
	sizeUnits?: string;
}

export interface ImageErrorTextsOptions {
	noFileGiven?: string;
	typeNotAllowed?: string;
	fileTooLarge?: string;
	importError?: string;
	filesTooLarge?: string;
}

export interface Options {
	extensions?: Extension[],
	host?: LitElement;
	autofocus?: boolean;
	autocomplete?: boolean;
	autosave?: AutoSaveOptions;
	autoRefresh?: boolean | { delay: number; };
	blockStyles?: BlockStyleOptions;
	hideIcons?: (stringliteral | BuiltInAction)[];
	initialValue?: string;
	lineNumbers?: boolean;
	lineWrapping?: boolean;
	parsingConfig?: ParsingOptions;
	placeholder?: string;
	previewImagesInEditor?: boolean;
	imagesPreviewHandler?: (src: string) => string;
	previewRender?: (markdownPlaintext: string) => Promise<string>;
	promptURLs?: boolean;
	renderingConfig?: RenderingOptions;
	tabSize?: number;
	statusbar?: (stringliteral | BuildInStatus)[];
	statusbarStatuses?: StatusBarItem[];
	toolbar?: (stringliteral | BuiltInAction)[];
	toolbarActions?: (ToolbarButton | ToolbarDropdown)[];
	toolbarTooltips?: boolean;
	drawables?: {name: string; value: string}[];
	unorderedListStyle?: '*' | '-' | '+';
	uploadImage?: boolean;
	imageMaxSize?: number;
	imageAccept?: string;
	imageUploadFunction?: (file: File, onSuccess: (url: string) => void, onError: (error: string) => void) => void;
	imageUploadEndpoint?: string;
	imagePathAbsolute?: boolean;
	imageCSRFToken?: string;
	imageCSRFName?: string;
	imageCSRFHeader?: boolean;
	imageTexts?: ImageTextsOptions;
	errorMessages?: ImageErrorTextsOptions;
	errorCallback?: (errorMessage: string) => void;
	promptTexts?: PromptTexts;
	direction?: 'ltr' | 'rtl';
}
