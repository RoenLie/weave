export interface ReactiveController {
	hostConnected?(): void;
	hostDisconnected?(): void;
	hostUpdate?(): void;
	hostUpdated?(): void;
}


export interface ReactiveControllerHost {
	addController(controller: ReactiveController): void;
	removeController(controller: ReactiveController): void;
	requestUpdate(): void;
	readonly updateComplete: Promise<boolean>;
}
