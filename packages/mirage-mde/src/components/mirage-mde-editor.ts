import {
	autocompletion,
	closeBrackets,
	closeBracketsKeymap,
	completionKeymap,
} from '@codemirror/autocomplete';
import {
	defaultKeymap,
	history,
	historyKeymap,
} from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import {
	defaultHighlightStyle,
	foldKeymap,
	HighlightStyle,
	indentOnInput,
	indentUnit,
	syntaxHighlighting,
} from '@codemirror/language';
import { languages } from '@codemirror/language-data';
import { lintKeymap } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import {
	crosshairCursor,
	drawSelection,
	dropCursor,
	EditorView,
	highlightSpecialChars,
	type KeyBinding,
	keymap,
	lineNumbers,
	rectangularSelection,
} from '@codemirror/view';
import { styleTags, Tag, tags } from '@lezer/highlight';
import { type MarkdownConfig } from '@lezer/markdown';
import { iterate } from '@roenlie/mimic-core/iterators';
import { basicDark } from 'cm6-theme-basic-dark';
import { css, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';

import { insertTab, removeTab } from '../codemirror/commands/tab-list.js';
import { toggleCheckbox } from '../codemirror/commands/toggle-checkbox.js';
import { editorToPreview, handleEditorScroll } from '../codemirror/commands/toggle-sidebyside.js';
import { updatePreviewListener } from '../codemirror/listeners/update-preview.js';
import { updateStatusbarListener } from '../codemirror/listeners/update-statusbar.js';
import { updateToolbarStateListener } from '../codemirror/listeners/update-toolbar.js';
import { type MirageMDE } from '../mirage-mde.js';
import type { MMDECommand, ToolbarButton } from '../registry/action-registry.js';


@customElement('mirage-mde-editor')
export class EditorElement extends LitElement {

	@property({ type: Object }) public scope: MirageMDE;
	protected globalShortcuts: KeyBinding[] = [];
	protected documentOnKeyDown = (ev: KeyboardEvent) => {
		const pressedKey = ev.key.toUpperCase();
		const modifierMap: Record<string, string> = {
			'c-': 'ctrlKey',
			'a-': 'altKey',
			's-': 'shiftKey',
		};

		this.globalShortcuts.forEach(({ key, preventDefault, run }) => {
			if (!key)
				return;

			const parts = key.replace(/-/g, '- ').split(' ');
			const modifiers = parts.filter(p => p.includes('-')).map(m => modifierMap[m]!);
			const requiredKey = parts.filter(p => !p.includes('-')).at(0)?.toUpperCase();

			if (modifiers.every(m => (ev as any)[m]) && pressedKey === requiredKey) {
				if (preventDefault)
					ev.preventDefault();

				run?.(this.scope.editor);
			}
		});
	};

	public override connectedCallback(): void {
		super.connectedCallback();

		globalThis.addEventListener('keydown', this.documentOnKeyDown);
	}

	public override disconnectedCallback() {
		super.disconnectedCallback();

		globalThis.removeEventListener('keydown', this.documentOnKeyDown);
	}

	public create() {
		const shortcuts = iterate(this.scope.registry.action)
			.pipe(([ , v ]) => v.type === 'button' ? v : undefined)
			.pipe(item => {
				if (!item.shortcut || typeof item.action !== 'function')
					return;

				return item as Omit<ToolbarButton, 'action'> & { action: MMDECommand };
			})
			.pipe(button => {
				const keybinding: KeyBinding = {
					key:            button.shortcut,
					run:            (view: EditorView) => button.action(view, this.scope),
					preventDefault: true,
				};

				if (button.global)
					this.globalShortcuts.push(keybinding);
				else
					return keybinding;
			})
			.toArray();


		const customTags = {
			headingMark: Tag.define(),
			table:       Tag.define(),
		};

		const MarkStylingExtension: MarkdownConfig = {
			props: [
				styleTags({
					HeaderMark: customTags.headingMark,
				}),
			],
		};


		const extensions = [
			// Consumer custom extensions.
			...this.scope.options.extensions ?? [],

			EditorView.updateListener.of(update => updateToolbarStateListener(update, this.scope)),
			EditorView.updateListener.of(update => updateStatusbarListener(update, this.scope)),
			EditorView.updateListener.of(update => updatePreviewListener(update, this.scope)),
			EditorView.domEventHandlers({
				scroll: (ev) => handleEditorScroll(ev, this.scope),
			}),

			history(),
			dropCursor(),
			drawSelection(),
			crosshairCursor(),
			rectangularSelection(),

			indentUnit.of(' '.repeat(this.scope.options.tabSize!)),
			EditorState.tabSize.of(this.scope.options.tabSize!),
			EditorState.allowMultipleSelections.of(true),

			// editor language
			markdown({
				base:          markdownLanguage,
				codeLanguages: languages,
				addKeymap:     true,
				extensions:    [ MarkStylingExtension ],
			}),

			// keyboard behavior
			indentOnInput(),
			closeBrackets(),
			keymap.of([
				...shortcuts,
				{
					key:   'Tab',
					run:   view => insertTab(view, this.scope),
					shift: view => removeTab(view, this.scope),
				},
				{ key: 'c-d', run: toggleCheckbox },
				...closeBracketsKeymap,
				...defaultKeymap,
				...searchKeymap,
				...historyKeymap,
				...foldKeymap,
				...completionKeymap,
				...lintKeymap,
			]),

			// Styles
			//bracketMatching(),
			//highlightActiveLine(),
			//highlightActiveLineGutter(),
			highlightSpecialChars(),
			highlightSelectionMatches(),
			basicDark,
			syntaxHighlighting(HighlightStyle.define([
				{ tag: tags.heading1, class: 'cm-header-1' },
				{ tag: tags.heading2, class: 'cm-header-2' },
				{ tag: tags.heading3, class: 'cm-header-3' },
				{ tag: tags.heading4, class: 'cm-header-4' },
				{ tag: tags.heading5, class: 'cm-header-5' },
				{ tag: tags.heading6, class: 'cm-header-6' },
				{ tag: customTags.headingMark, class: 'ͼ1m cm-heading-mark' },
			])),
			syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
		];

		if (this.scope.options.autocomplete ?? true) {
			extensions.push(
				autocompletion({
					tooltipClass: () => 'mmde-tooltip',
				}),
			);
		}
		if (this.scope.options.lineWrapping)
			extensions.push(EditorView.lineWrapping);
		if (this.scope.options.lineNumbers)
			extensions.push(lineNumbers());


		this.scope.editor = new EditorView({
			parent: this.renderRoot,
			state:  EditorState.create({
				doc: this.scope.options.initialValue,
				extensions,
			}),
		});

		// Do an initial conversion of the markdown to speed up opening the preview.
		requestIdleCallback(() => editorToPreview(this.scope));
	}

	public static override styles = [
		css`
		:host, * { box-sizing: border-box; }
		:host {
			display: grid;
			overflow: hidden;
			box-sizing: border-box;
			color: var(--_mmde-color);
			border: var(--_mmde-border);
			border-bottom: none;
			background-color: var(--_mmde-background-color);
		}
		.cm-editor {
			overflow: hidden;
		}
		.cm-scroller::-webkit-scrollbar {
			width: var(--_mmde-scrollsize);
			height: var(--_mmde-scrollsize);
		}
		.cm-scroller::-webkit-scrollbar-track {
			background: var(--_mmde-scrollbg);
		}
		.cm-scroller::-webkit-scrollbar-thumb {
			background: var(--_mmde-scrollthumb);
			border-radius: 0px;
			background-clip: padding-box;
		}
		.cm-scroller::-webkit-scrollbar-corner {
			background: var(--_mmde-scrollbg);
		}
		:host .cm-scroller {
			font-family: var(--_mmde-editor-family);
		}
		:host .cm-gutters {
			background-color: rgb(25, 34, 43);
			border-right: 1px solid rgb(30, 40, 50);
		}
		.cm-header-1,
		.cm-header-2,
		.cm-header-3,
		.cm-header-4,
		.cm-header-5,
		.cm-header-6 {
			font-weight: 600;
			line-height: 1.25;
		}
		.cm-header-1 {
			font-weight: 600;
			font-size: 2em;
		}
		.cm-header-2 {
			font-weight: 600;
			font-size: 1.5em;
		}
		.cm-header-3 {
			font-weight: 600;
			font-size: 1.25em;
		}
		.cm-header-4 {
			font-weight: 600;
			font-size: 1em;
		}
		.cm-header-5 {
			font-weight: 600;
			font-size: .875em;
		}
		.cm-header-6 {
			font-weight: 600;
			font-size: .85em;
			color: #8b949e;
		}
		.ͼo {
			background-color: var(--_mmde-editor-bg);
		}
		.ͼo .cm-selectionBackground {
			background-color: rgba(175, 175, 175, 0.3) !important;
		}
		.mmde-tooltip.cm-tooltip {
			background-color: rgb(25, 34, 43);
			border: 2px solid var(--_mmde-scrollthumb);
			border-radius: var(--_mmde-border-radius);
		}
		.mmde-tooltip.cm-tooltip>ul::-webkit-scrollbar {
			width: var(--_mmde-scrollsize);
			height: var(--_mmde-scrollsize);
		}
		.mmde-tooltip.cm-tooltip>ul::-webkit-scrollbar-track {
			background: var(--_mmde-scrollbg);
		}
		.mmde-tooltip.cm-tooltip>ul::-webkit-scrollbar-thumb {
			background: var(--_mmde-scrollthumb);
			border-radius: 0px;
			background-clip: padding-box;
		}
		.mmde-tooltip.cm-tooltip>ul::-webkit-scrollbar-corner {
			background: var(--_mmde-scrollbg);
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mirage-mde-editor': EditorElement;
	}
}
