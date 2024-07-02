

type ElementProperties = Partial<{
	children: HTMLElement[];
}>


class ForgeElement {

	public static create<Props extends Record<string, any>>(
		tagName: string,
		creator: (horse: {
			props: Props,
			stylesheet: (css: string) => void,
			children: (...elements: HTMLElement[]) => void,
		}) => void,
	) {
		const cls = class extends HTMLElement {};
		customElements.define(tagName, cls);

		return (props: Props & ElementProperties) => {
			const el = document.createElement(tagName);
			const root = el.attachShadow({ mode: 'open' });

			el.append(...props.children ?? []);

			creator({
				props,
				stylesheet: (css: string) => {
					const sheet = new CSSStyleSheet();
					sheet.replaceSync(css);
					root.adoptedStyleSheets = [ sheet ];
				},
				children: (...elements: HTMLElement[]) => {
					root.append(...elements);
				},
			});

			return el;
		};
	}

	public static button(props: Partial<{
		text: string
	}> = {}) {
		const el = document.createElement('button');
		el.innerText = props.text ?? '';

		return el;
	}

	public static slot(props: Partial<{
		name: string
	}> = {}) {
		const el = document.createElement('slot');
		el.name = props.name ?? '';

		return el;
	}

}


const testElement = ForgeElement.create<{label: string}>(
	'f-test1', ({ stylesheet, children }) => {
		stylesheet(`
		:host {
			position: fixed;
			display: block;
			background-color: red;
			width: 100px;
			height: 100px;
			top: 0px;
			left: 0px;
		}
		`);

		children(
			testElement2({
				label:    'Inner element',
				children: [ ForgeElement.button({ text: 'BUTTON! 😊' }) ],
			}),
		);
	},
);


const testElement2 = ForgeElement.create(
	'f-test2', ({ stylesheet, children }) => {
		stylesheet(`
		:host {
			position: fixed;
			display: block;
			background-color: blue;
			width: 50px;
			height: 50px;
			top: 0px;
			left: 0px;
		}
		`);

		children(
			ForgeElement.slot(),
		);
	},
);


document.body.append(testElement({ label: 'label goes here' }));
