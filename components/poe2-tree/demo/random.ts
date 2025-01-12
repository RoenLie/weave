import { LitElement } from 'lit';
import { state } from 'lit/decorators.js';

export class RandomTree extends LitElement {

	@state() protected accessor tooltip: string = '';

}
