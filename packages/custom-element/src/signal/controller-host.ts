import type { ReactiveController, ReactiveControllerHost } from '../shared/reactive-controller.ts';
import { SignalElement } from './signal-element.ts';


export class ReactiveSignalControllerHost extends SignalElement implements ReactiveControllerHost {

	#controllers: Set<ReactiveController> = new Set();

	protected override connectedCallback(): void {
		super.connectedCallback();

		for (const controller of this.#controllers)
			controller.hostConnected?.();
	}

	protected override disconnectedCallback(): void {
		super.disconnectedCallback();

		for (const controller of this.#controllers)
			controller.hostDisconnected?.();
	}


	addController(controller: ReactiveController): void {
		this.#controllers.add(controller);

		if (this.hasConnected)
			controller.hostConnected?.();
	}

	removeController(controller: ReactiveController): void {
		this.#controllers.delete(controller);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected override beforeUpdate(changedProps: Set<string>): void {
		for (const controller of this.#controllers)
			controller.hostUpdate?.();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	protected override afterUpdate(changedProps: Set<string>): void {
		for (const controller of this.#controllers)
			controller.hostUpdated?.();
	}

}
