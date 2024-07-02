import { Adapter, ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.js';
import { html } from 'lit';


class NewSidebar extends Adapter {

	public override render() {
		return html`
		This is a complete override of the sidebar.
		`;
	}

}


const module = new ContainerModule(({ rebind }) => {
	//rebind('midoc-sidebar').to(NewSidebar);
});

ContainerLoader.load(module);
