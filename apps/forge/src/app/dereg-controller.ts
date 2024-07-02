import type { ReactiveController, ReactiveControllerHost } from 'lit';

export class DeregController implements ReactiveController {

	protected unsubscribers: (() => void)[] = [];
	protected registrators: (() => () => void)[] = [];

	constructor(
		protected host: ReactiveControllerHost | { element: ReactiveControllerHost; },
		...registrators: (() => () => void)[]
	) {
		if ('element' in host)
			host.element.addController(this);
		else
			host.addController(this);

		this.registrators = registrators;
	}

	public add(...unsubscribeFn: (() => void)[]): this {
		this.unsubscribers.push(...unsubscribeFn);

		return this;
	}

	public clear(): this {
		this.unsubscribers.forEach(unsubscribe => unsubscribe());
		this.unsubscribers.length = 0;

		return this;
	}

	public hostConnected(): void {
		for (const register of this.registrators)
			this.add(register());
	}

	public hostDisconnected(): void {
		this.clear();
	}

}
