import { PathTreeAdapter } from '@roenlie/mirage-docs/app';
import { ContainerLoader, ContainerModule } from '@roenlie/mirage-docs/app/aegis.js';
import type { PropertyValues } from 'lit';


class NewSidebar extends PathTreeAdapter {

	public override willUpdate(props: PropertyValues): void {
		super.willUpdate(props);

		console.log(this.element.paths);
	}

}


const module = new ContainerModule(({ rebind }) => {
	rebind('midoc-path-tree').toConstantValue(NewSidebar);
});

ContainerLoader.load(module);
