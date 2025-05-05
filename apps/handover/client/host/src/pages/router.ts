import { AdapterElement } from '@roenlie/custom-element/adapter';
import { Router } from '@roenlie/custom-element/router';


export class RouterCmp extends AdapterElement {

	protected routes = new Router(this, []);

}
