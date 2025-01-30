import { EditorView, basicSetup } from 'codemirror';
import { json } from '@codemirror/lang-json';
import { basicDark } from 'cm6-theme-basic-dark';
import { css, CustomElement, signal } from '../../app/custom-element.ts';


export class DetailsPanel extends CustomElement {

	static { this.register('details-panel'); }

	@signal public accessor data: Map<string, any>;
	protected editor: EditorView;

	protected override afterConnected(): void {
		this.editor = new EditorView({
			parent:     this.shadowRoot!,
			doc:        JSON.stringify(Object.fromEntries(this.data), null, 2),
			extensions: [
				basicSetup,
				EditorView.updateListener.of(update => {
					if (update.docChanged) {
						try {
							const docString = update.state.doc.toString();
							const docMap = new Map(Object.entries(JSON.parse(docString)));

							this.data.clear();
							for (const [ key, value ] of docMap)
								this.data.set(key, value);
						}
						catch { /*  */ }
					}
				}),
				basicDark,
				json(),
			],
		});
	}

	protected override beforeRender(changedProps: Set<string>): void {
		super.beforeRender(changedProps);

		if (this.hasRendered && changedProps.has('data')) {
			if (!this.data)
				this.style.visibility = 'hidden';
			else
				this.style.visibility = 'visible';

			this.setEditorFromData();
		}
	}

	protected setEditorFromData() {
		try {
			const docString = this.editor.state.doc.toString();
			const docMap = new Map(Object.entries(JSON.parse(docString)));

			const mapEqual = (map1: Map<string, any>, map2: Map<string, any>): boolean => {
				if (map1.size !== map2.size)
					return false;

				for (const [ key, val ] of map1) {
					if (!map2.has(key) || map2.get(key) !== val)
						return false;
				}

				return true;
			};

			if (!mapEqual(docMap, this.data)) {
				this.editor.dispatch(this.editor.state.update({
					changes: {
						from:   0,
						to:     this.editor.state.doc.length,
						insert: JSON.stringify(Object.fromEntries(this.data), null, 2),
					},
				}));
			}
		}
		catch { /*  */ }
	}


	public static override styles = css`
		:host {
			display: grid;
		}
	`;

}
