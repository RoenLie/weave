import type { ComputedFlat } from '@roenlie/core/types';
import { LitElement, type ReactiveController } from 'lit';


type Falsy = false | 0 | -0 | null | undefined;


export class StyleController implements ReactiveController {

	protected styleString = '';
	protected stylesheet = new CSSStyleSheet();
	protected host: LitElement & { shadowRoot: ShadowRoot };
	protected get root() {
		return this.host.shadowRoot;
	}

	constructor(
		host: ComputedFlat<LitElement>,
		protected updateStyle: (css: StyleController['css']) => string | (string | Falsy)[],
	) {
		(this.host = host as any).addController(this);
	}

	public css = (strings: TemplateStringsArray, ...values: any[]): string => {
		let result = '';
		for (let i = 0; i < strings.length; i++) {
			const string = strings[i]!;
			result += string;

			const value = values[i];
			if (value !== undefined)
				result += value;
		}

		result = result.replaceAll(/[\n]+/g, '');

		return result;
	};

	public async hostConnected(): Promise<void> {
		await this.host.updateComplete;

		if (!this.host.shadowRoot) {
			throw new Error('Style controller uses adoptedStyleSheets'
				+ ' therefor it only works on elements that have a ShadowRoot');
		}

		this.root.adoptedStyleSheets.push(this.stylesheet);
	}

	public hostDisconnected(): void {
		const index = this.root.adoptedStyleSheets.indexOf(this.stylesheet);
		if (index > -1)
			this.root.adoptedStyleSheets.splice(index, 1);
	}

	public hostUpdate(): void {
		let result = this.updateStyle(this.css);
		result = Array.isArray(result) ? result : [ result ];

		let styles = '';
		for (const style of result)
			style && (styles += style);

		if (styles === this.styleString)
			return;

		this.styleString = styles;
		this.stylesheet.replaceSync(styles);
	}

}
