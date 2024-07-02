import {
	Adapter, AegisComponent, ContainerModule,
	customElement, inject, query, state,
} from '@roenlie/lit-aegis';
import { html } from 'lit';


export class AegisTestAdapter extends Adapter {

	@inject('test-value') protected testValue: string;
	@state() protected stateValue = 0;
	@query('div') protected divEl: HTMLElement;

	constructor(@inject('test-value') protected testVal1: string) {
		super();

		console.log({ testVal1 });
	}

	public override connectedCallback(): void {
		//console.log(this.testValue);
		//console.log(this.testVal1);
	}

	public override afterConnectedCallback(): void {
		this.stateValue++;
	}

	public override render(): unknown {
		return html`
		Hello from aegis adapter.
		${ this.testValue }

		<div>${ this.stateValue }</div>
		`;
	}

}


@customElement('aegis-test-component')
export class AegisTestComponent extends AegisComponent {

	constructor() {
		super(AegisTestAdapter, containerModule);
	}

}


const containerModule = new ContainerModule(({ bind }) => {
	bind('test-value').toConstantValue('Hello I am a constant value');
});
