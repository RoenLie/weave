import { EditorView } from '@codemirror/view';
import { deepMerge } from '@roenlie/mimic-core/structs';
import type { stringliteral } from '@roenlie/mimic-core/types';
import { LitElement } from 'lit';
import { type Ref } from 'lit/directives/ref.js';

import {
	uploadImage,
	uploadImages,
	uploadImagesUsingCustomFunction,
	uploadImageUsingCustomFunction,
} from './actions/upload-images.js';
import { type Marker } from './codemirror/listeners/get-state.js';
import { performAction } from './codemirror/utils/perform-action.js';
import { EditorElement } from './components/mirage-mde-editor.js';
import { PreviewElement } from './components/mirage-mde-preview.js';
import { StatusbarElement } from './components/mirage-mde-statusbar.js';
import { ToolbarElement } from './components/mirage-mde-toolbar.js';
import { WindowElement } from './components/mirage-mde-window.js';
import {
	blockStyles,
	errorMessages,
	imageTexts,
	promptTexts,
	timeFormat,
} from './constants.js';
import type {
	BlockStyleOptions,
	ImageErrorTextsOptions,
	ImageTextsOptions,
	Options,
	ParsingOptions,
	PromptTexts,
	TimeFormatOptions,
} from './mirage-mde-types.js';
import { type BuiltInAction, defaultToolbar, type ToolbarItem } from './registry/action-registry.js';
import { createRegistry } from './registry/registry.js';
import {
	type BuildInStatus,
	defaultStatus,
	type StatusBarItem,
} from './registry/status-registry.js';
import { autosave } from './utilities/autosave.js';
import { markdown } from './utilities/markdown.js';
import { openBrowseFileWindow } from './utilities/open-file-window.js';
import { value } from './utilities/value.js';


interface GUIElements {
	editor: EditorElement;
	preview: PreviewElement;
	toolbar: ToolbarElement;
	statusbar: StatusbarElement;
	window?: WindowElement;
}
type GUIClasses = Record<keyof GUIElements, Partial<Record<'hidden', boolean>>>;


export class MirageMDE {

	public options: Options;
	public host: LitElement;
	public editor: EditorView;
	public toolbar: (stringliteral | BuiltInAction)[];
	public toolbarElements: Record<string, Ref<HTMLElement>> = {};
	public statusbar: (stringliteral | BuildInStatus)[];
	public saved = false;
	public lastSaved = '';
	public autosaveTimeoutId: number | undefined;
	public activeMarkers: Marker[] = [];
	public registry = createRegistry();
	public gui: GUIElements = {} as any;
	public guiClasses: GUIClasses = {
		preview:   { hidden: true },
		editor:    {},
		toolbar:   {},
		statusbar: {},
		window:    {},
	};

	public get isSideBySideActive() {
		return this.host.classList.contains('sidebyside');
	}

	public get isPreviewActive() {
		return this.host?.classList.contains('preview');
	}

	public get isFullscreenActive() {
		return this.host.classList.contains('fullscreen');
	}

	public get isWindowActive() {
		return !!this.gui.window;
	}

	constructor(options: Options = {} as any) {
		this.options = options;

		// Assign the host.
		this.host = options.host!;

		// Handle toolbar
		this.toolbar = [ ...options.toolbar ?? defaultToolbar ];

		// Register any additional toolbar actions.
		options.toolbarActions?.forEach(action => {
			const existing = (this.registry.action.get(action.name) ?? {}) as ToolbarItem;
			if (action.type === existing.type)
				this.registry.action.set(action.name, deepMerge<ToolbarItem>([ existing, action ]));
			else
				this.registry.action.set(action.name, action);
		});

		// Handle status bar
		this.statusbar ??= [ ...options.statusbar ?? defaultStatus ];
		options.statusbarStatuses?.forEach(status => {
			const existing = (this.registry.status.get(status.name) ?? {}) as StatusBarItem;
			if (existing)
				this.registry.status.set(status.name, deepMerge([ existing, status ]));
			else
				this.registry.status.set(status.name, status);
		});

		if (options.uploadImage)
			this.statusbar.unshift('upload-image');

		options.renderingConfig = deepMerge([
			{
				singleLineBreaks:       true,
				codeSyntaxHighlighting: true,
			},
			options.renderingConfig ?? {},
		]);

		// linewrapping defaults to true.
		options.lineWrapping ??= true;

		// Default to showing line numbers.
		options.lineNumbers ??= true;

		// Default tab size of 3 spaces.
		options.tabSize ??= 3;

		// Add default preview rendering function
		options.previewRender ??= (plainText) => markdown(this, plainText);

		// Set default options for parsing config
		options.parsingConfig = deepMerge<ParsingOptions>([
			{
				highlightFormatting: true, // needed for toggleCodeBlock to detect types of code
			}, options.parsingConfig || {},
		]);

		// Merging the insertTexts, with the given options
		options.drawables?.forEach(({ name, value }) => {
			this.registry.draw.set(name, value);
		});

		// Merging the promptTexts, with the given options
		options.promptTexts = deepMerge<PromptTexts>([ promptTexts, options.promptTexts || {} ]);

		// Merging the blockStyles, with the given options
		options.blockStyles = deepMerge<BlockStyleOptions>([ blockStyles, options.blockStyles || {} ]);

		if (options.autosave) {
			// Merging the Autosave timeFormat, with the given options
			options.autosave.timeFormat = deepMerge<TimeFormatOptions>(
				[ timeFormat as any, options.autosave.timeFormat || {} ],
			);
		}

		options.direction = options.direction ?? 'ltr';

		options.errorCallback = options.errorCallback ?? function(errorMessage) {
			alert(errorMessage);
		};

		// Import-image default configuration
		options.uploadImage       = options.uploadImage ?? false;
		options.imageMaxSize      = options.imageMaxSize ?? 2097152; // 1024 * 1024 * 2
		options.imageAccept       = options.imageAccept ?? 'image/png, image/jpeg, image/gif, image/avif';
		options.imageTexts        = deepMerge<ImageTextsOptions>([ imageTexts, options.imageTexts || {} ]);
		options.errorMessages     = deepMerge<ImageErrorTextsOptions>([ errorMessages, options.errorMessages || {} ]);
		options.imagePathAbsolute = options.imagePathAbsolute ?? false;
		options.imageCSRFName     = options.imageCSRFName ?? 'csrfmiddlewaretoken';
		options.imageCSRFHeader   = options.imageCSRFHeader ?? false;
	}

	public openBrowseFileWindow = openBrowseFileWindow.bind(this);
	public autosave = autosave.bind(this);
	public uploadImage = uploadImage.bind(this);
	public uploadImages = uploadImages.bind(this);
	public uploadImageUsingCustomFunction = uploadImageUsingCustomFunction.bind(this);
	public uploadImagesUsingCustomFunction = uploadImagesUsingCustomFunction.bind(this);

	// Public Actions
	public value(val: string | undefined): MirageMDE
	public value(val?: undefined): string
	public value(val: any): any { return value(this, val); }

	public toggleBold() {
		performAction(this, this.registry.action.get('bold'));
	}

	public toggleItalic() {
		performAction(this, this.registry.action.get('italic'));
	}

	public toggleStrikethrough() {
		performAction(this, this.registry.action.get('strikethrough'));
	}

	public toggleCodeBlock() {
		performAction(this, this.registry.action.get('code'));
	}

	public toggleQuote() {
		performAction(this, this.registry.action.get('quote'));
	}

	public toggleList(type: 'ordered' | 'unordered') {
		performAction(this, this.registry.action.get(type + '-list'));
	}

	public togglePreview() {
		performAction(this, this.registry.action.get('preview'));
	}

	public toggleSizeBySize() {
		performAction(this, this.registry.action.get('side-by-side'));
	}

	public toggleFullscreen() {
		performAction(this, this.registry.action.get('fullscreen'));
	}

	public toggleHeading() {
		performAction(this, this.registry.action.get('heading'));
	}

	public headingBigger() {
		performAction(this, this.registry.action.get('heading-bigger'));
	}

	public headingSmaller() {
		performAction(this, this.registry.action.get('heading-smaller'));
	}

	public setHeadingLevel(size: 1|2|3|4|5|6) {
		const action = this.registry.action.get('heading-' + size);
		performAction(this, action);
	}

	public cleanBlock() {
		performAction(this, this.registry.action.get('clean-block'));
	}

	public drawLink() {
		performAction(this, this.registry.action.get('link'));
	}

	public drawImage() {
		performAction(this, this.registry.action.get('image'));
	}

	public drawUploadedImage() {
		performAction(this, this.registry.action.get('upload-image'));
	}

	public drawTable() {
		performAction(this, this.registry.action.get('table'));
	}

	public drawLine() {
		performAction(this, this.registry.action.get('horizontal-rule'));
	}

	public popoutPreview() {
		performAction(this, this.registry.action.get('popout'));
	}

	public undo() {
		performAction(this, this.registry.action.get('undo'));
	}

	public redo() {
		performAction(this, this.registry.action.get('redo'));
	}

}
