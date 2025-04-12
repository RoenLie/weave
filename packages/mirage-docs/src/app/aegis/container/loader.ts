import { Container } from './container.js';


export class ContainerFacility {

	static container = new Container({ skipBaseClassChecks: true });

}


export class ContainerLoader {

	static readonly loadingQueue: Promise<any>[] = [];

	static async waitForQueue() {
		while (ContainerLoader.loadingQueue.length)
			await ContainerLoader.loadingQueue[0];
	}

	static addToLoadingQueue(promise: Promise<any>) {
		this.loadingQueue.push(promise);
	}

	static removeFromLoadingQueue(promise: Promise<any>) {
		this.loadingQueue
			.splice(this.loadingQueue.indexOf(promise), 1);
	}

	static get load() {
		return ContainerFacility.container.load
			.bind(ContainerFacility.container);
	}

	static get unload() {
		return ContainerFacility.container.unload
			.bind(ContainerFacility.container);
	}

	static get isBound() {
		return ContainerFacility.container.isBound
			.bind(ContainerFacility.container);
	}

	static get get() {
		return ContainerFacility.container.get
			.bind(ContainerFacility.container);
	}

	static get getAsync() {
		return ContainerFacility.container.getAsync
			.bind(ContainerFacility.container);
	}

	static get getTagged() {
		return ContainerFacility.container.getTagged
			.bind(ContainerFacility.container);
	}

	static get getTaggedAsync() {
		return ContainerFacility.container.getTaggedAsync
			.bind(ContainerFacility.container);
	}

	static get getNamed() {
		return ContainerFacility.container.getNamed
			.bind(ContainerFacility.container);
	}

	static get getNamedAsync() {
		return ContainerFacility.container.getNamedAsync
			.bind(ContainerFacility.container);
	}

	static get getAll() {
		return ContainerFacility.container.getAll
			.bind(ContainerFacility.container);
	}

	static get getAllAsync() {
		return ContainerFacility.container.getAllAsync
			.bind(ContainerFacility.container);
	}

	static get getAllTagged() {
		return ContainerFacility.container.getAllTagged
			.bind(ContainerFacility.container);
	}

	static get getAllTaggedAsync() {
		return ContainerFacility.container.getAllTaggedAsync
			.bind(ContainerFacility.container);
	}

	static get getAllNamed() {
		return ContainerFacility.container.getAllNamed
			.bind(ContainerFacility.container);
	}

	static get getAllNamedAsync() {
		return ContainerFacility.container.getAllNamedAsync
			.bind(ContainerFacility.container);
	}

	static get resolve() {
		return ContainerFacility.container.resolve
			.bind(ContainerFacility.container);
	}

}
