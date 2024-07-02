import { Container } from './container.js';


export class ContainerFacility {

	public static container = new Container({ skipBaseClassChecks: true });

}


export class ContainerLoader {

	public static get load() {
		return ContainerFacility.container.load
			.bind(ContainerFacility.container);
	}

	public static get unload() {
		return ContainerFacility.container.unload
			.bind(ContainerFacility.container);
	}

	public static get isBound() {
		return ContainerFacility.container.isBound
			.bind(ContainerFacility.container);
	}

	public static get get() {
		return ContainerFacility.container.get
			.bind(ContainerFacility.container);
	}

	public static get getAsync() {
		return ContainerFacility.container.getAsync
			.bind(ContainerFacility.container);
	}

	public static get getTagged() {
		return ContainerFacility.container.getTagged
			.bind(ContainerFacility.container);
	}

	public static get getTaggedAsync() {
		return ContainerFacility.container.getTaggedAsync
			.bind(ContainerFacility.container);
	}

	public static get getNamed() {
		return ContainerFacility.container.getNamed
			.bind(ContainerFacility.container);
	}

	public static get getNamedAsync() {
		return ContainerFacility.container.getNamedAsync
			.bind(ContainerFacility.container);
	}

	public static get getAll() {
		return ContainerFacility.container.getAll
			.bind(ContainerFacility.container);
	}

	public static get getAllAsync() {
		return ContainerFacility.container.getAllAsync
			.bind(ContainerFacility.container);
	}

	public static get getAllTagged() {
		return ContainerFacility.container.getAllTagged
			.bind(ContainerFacility.container);
	}

	public static get getAllTaggedAsync() {
		return ContainerFacility.container.getAllTaggedAsync
			.bind(ContainerFacility.container);
	}

	public static get getAllNamed() {
		return ContainerFacility.container.getAllNamed
			.bind(ContainerFacility.container);
	}

	public static get getAllNamedAsync() {
		return ContainerFacility.container.getAllNamedAsync
			.bind(ContainerFacility.container);
	}

	public static get resolve() {
		return ContainerFacility.container.resolve
			.bind(ContainerFacility.container);
	}

}
