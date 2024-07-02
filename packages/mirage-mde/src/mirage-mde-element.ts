import './components/mirage-mde-editor.js';
import './components/mirage-mde-toolbar.js';
import './components/mirage-mde-statusbar.js';
import './components/mirage-mde-preview.js';
import './components/mirage-mde-dragbar.js';

import { css, html, LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { customElement } from 'lit/decorators/custom-element.js';
import { classMap } from 'lit/directives/class-map.js';
import { when } from 'lit/directives/when.js';

import { type DragbarElement } from './components/mirage-mde-dragbar.js';
import { MirageMDE } from './mirage-mde.js';
import { type Options } from './mirage-mde-types.js';


@customElement('mirage-mde')
export class MirageMDEElement extends LitElement {

	@property({ type: Object }) public options: Options = {};
	public scope: MirageMDE;

	public override async connectedCallback() {
		super.connectedCallback();
		await this.updateComplete;

		this.scope = new MirageMDE({
			host:        this,
			uploadImage: false,
			autosave:    undefined,
			...this.options,
		});

		this.requestUpdate();
		await this.updateComplete;

		const editor = this.renderRoot.querySelector('mirage-mde-editor');
		this.scope.gui.editor = editor!;

		const toolbar = this.renderRoot.querySelector('mirage-mde-toolbar');
		this.scope.gui.toolbar = toolbar!;

		const preview = this.renderRoot.querySelector('mirage-mde-preview');
		this.scope.gui.preview = preview!;

		const statusbar = this.renderRoot.querySelector('mirage-mde-statusbar');
		this.scope.gui.statusbar = statusbar!;

		[ editor, toolbar, statusbar, preview ].forEach(el => el?.create());
	}

	protected override render() {
		return html`
		<mirage-mde-toolbar
			.scope=${ this.scope }
			style="grid-area:toolbar;"
			class=${ classMap(this.scope?.guiClasses.toolbar ?? {}) }
		></mirage-mde-toolbar>

		<mirage-mde-editor
			.scope=${ this.scope }
			style="grid-area:editor;"
			class=${ classMap(this.scope?.guiClasses.editor ?? {}) }
		></mirage-mde-editor>

		${ when(this.scope?.isSideBySideActive, () => html`
		<mirage-mde-dragbar
			style="grid-area:sidebyside;position:absolute;height:100%;"
			.handledrag=${ ((): DragbarElement['handledrag'] => {
				return {
					orientation: 'right' as const,
					host:        this,
					wrapperQry:  () => this,
					elementQry:  () => this.scope!.gui.preview,
				};
			})() }
		></mirage-mde-dragbar>
		`) }

		<mirage-mde-preview
			.scope=${ this.scope }
			style="grid-area:sidebyside;"
			class=${ classMap(this.scope?.guiClasses.preview ?? {}) }
		></mirage-mde-preview>

		<mirage-mde-statusbar
			.scope=${ this.scope }
			style="grid-area:statusbar;"
			class=${ classMap(this.scope?.guiClasses.statusbar ?? {}) }
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
			position: relative;
			overflow: hidden;
			display: grid;
			grid-template: "toolbar" auto
								"editor" 1fr
								"statusbar" auto
								/ 1fr;
		}
		:host(.preview) {
			grid-template: "toolbar" auto
								"sidebyside" 1fr
								"statusbar" Auto
								/ 1fr;
		}
		:host(.sidebyside) {
			grid-template: "toolbar toolbar" auto
								"editor sidebyside" 1fr
								"statusbar statusbar" Auto
								/ 1fr auto
		}
		:host(.fullscreen) {
			position: fixed;
			top: 0;
			left: 0;
			width: 100%;
			height: 100%;
			resize: none;
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
