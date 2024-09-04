import './components/mirage-mde-editor.js';
import './components/mirage-mde-toolbar.js';
import './components/mirage-mde-statusbar.js';
import './components/mirage-mde-preview.js';
import './components/mirage-mde-dragbar.js';

import { css, html, LitElement, type PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';
import { customElement } from 'lit/decorators/custom-element.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { MirageMDE } from './mirage-mde.js';
import { type Options } from './mirage-mde-types.js';
import { GridFrResizeController } from './utilities/grid-fr-controller.js';


@customElement('mirage-mde')
export class MirageMDEElement extends LitElement {

	@property({ type: Object }) public options: Options = {};
	@property({ type: String }) public value = '';

	/** @deprecated Will be removed in the near future, Use editor prop instead. */
	@state() public scope:  MirageMDE;
	@state() public editor: MirageMDE;

	protected resizeCtrl = new GridFrResizeController({
		host:                this,
		setInitialFractions: () => [ 1, 1 ],
		getColumnIndex:      (_ev) => 0,
		getViewportWidth:    () => this.offsetWidth ?? 0,
	});

	public override connectedCallback() {
		super.connectedCallback();
		this.initialize();
	}

	protected override willUpdate(changedProperties: PropertyValues): void {
		super.willUpdate(changedProperties);

		if (changedProperties.has('value') && this.editor)
			this.editor.value(this.value);
	}

	protected async initialize() {
		this.editor = new MirageMDE({
			host:        this,
			uploadImage: false,
			autosave:    undefined,
			...this.options,
		});
		this.scope = this.editor;

		await this.updateComplete;

		const editor = this.renderRoot.querySelector('mirage-mde-editor');
		this.editor.gui.editor = editor!;

		const toolbar = this.renderRoot.querySelector('mirage-mde-toolbar');
		this.editor.gui.toolbar = toolbar!;

		const preview = this.renderRoot.querySelector('mirage-mde-preview');
		this.editor.gui.preview = preview!;

		const statusbar = this.renderRoot.querySelector('mirage-mde-statusbar');
		this.editor.gui.statusbar = statusbar!;

		[ editor, toolbar, statusbar, preview ].forEach(el => el?.create());

		this.editor.value(this.value);
	}

	protected override render(): unknown {
		return html`
		${ when(this.editor?.isSideBySideActive, () => html`
		<style>
			s-editor-area {
				grid-template-columns: ${ this.resizeCtrl.fractions.join('fr ') + 'fr;'	};
			}
		</style>
		`) }

		<mirage-mde-toolbar
			.scope=${ this.editor }
			style="grid-area:toolbar;"
			class=${ classMap(this.editor?.guiClasses.toolbar ?? {}) }
		></mirage-mde-toolbar>

		<s-editor-area style="grid-area:editor;">
			<mirage-mde-editor
				.scope=${ this.editor }
				class=${ classMap(this.editor?.guiClasses.editor ?? {}) }
			></mirage-mde-editor>

			${ when(this.editor?.isSideBySideActive, () => html`
			<mirage-mde-dragbar
				@mousedown=${ this.resizeCtrl.resize }
			></mirage-mde-dragbar>
			`) }

			<mirage-mde-preview
				.scope=${ this.editor }
				class=${ classMap(this.editor?.guiClasses.preview ?? {}) }
			></mirage-mde-preview>
		</s-editor-area>

		<mirage-mde-statusbar
			.scope=${ this.editor }
			style="grid-area:statusbar;"
			class=${ classMap(this.editor?.guiClasses.statusbar ?? {}) }
		></mirage-mde-statusbar>
		`;
	}

	public static override styles = [
		css`
		:host {
			--_mmde-border-radius:    var(--mmde-border-radius, 0px);
			--_mmde-border:           var(--mmde-border, 2px solid rgb(30, 40, 50));
			--_mmde-color:            var(--mmde-color, rgb(220, 220, 220));
			--_mmde-background-color: var(--mmde-background-color, rgb(13, 17, 23));
			--_mmde-toolbar-bg:       var(--mmde-toolbar-bg, rgb(30, 40, 50));
			--_mmde-scrollbg:         var(--mmde-scrollbg, rgb(30 40 50 / 75%));
			--_mmde-scrollthumb:      var(--mmde-scrollthumb, rgb(52, 70, 88));
			--_mmde-scrollsize:       var(--mmde-scrollsize, 12px);
			--_mmde-editor-family:    var(--mmde-editor-family, Helvetica);
			--_mmde-preview-family:   var(--mmde-preview-family, Helvetica);
			--_mmde-editor-bg:        var(--mmde-editor-bg, rgb(46, 50, 53));
		}
		:host {
			overflow: hidden;
			display: grid;
			grid-template: "toolbar" auto
								"editor" 1fr
								"statusbar" auto
								/ 1fr;
		}
		:host(.fullscreen) {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			resize: none;
		}
		s-editor-area {
			position: relative;
			display: grid;
		}
		mirage-mde-dragbar {
			position:absolute;
			height:100%;
			grid-column: 2/3;
		}
		.hidden {
			display: none;
		}
		`,
	];

}


declare global {
	interface HTMLElementTagNameMap {
		'mirage-mde': MirageMDEElement;
	}
}
