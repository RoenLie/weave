import { LitElement } from 'lit';

import { ButtonElement } from './button.tsx';


export class RootElement extends LitElement {

	protected render1(): unknown {
		return (
			<div class={'test-class'}>
				<ButtonElement></ButtonElement>
			</div>
		);
	}


	//protected immediateRender(): unknown {
	//	return (
	//		<div class="first-element">
	//			<h1>Lit JSX Demo</h1>
	//			<p>{'dynamic content goes here'}</p>
	//			<span>{(<s-inner-span></s-inner-span>)}</span>
	//		</div>
	//	);
	//}

	//protected variableRender(): unknown {
	//const jsx = (
	//	<div class="first-element">
	//		<h1>Lit JSX Demo</h1>
	//		<p>{'dynamic content goes here'}</p>
	//		<span>{(<s-inner-span></s-inner-span>)}</span>
	//	</div>
	//);

	//return jsx;
	//}


	static { customElements.define('root-element', this); }

}
