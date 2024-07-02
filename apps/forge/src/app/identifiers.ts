declare global {
	interface Ag {
		registerIdentifier: (name: string) => void;
	}

	// eslint-disable-next-line no-var, @typescript-eslint/no-unused-vars
	var Ag: Ag;
}


globalThis.Ag ??= {} as Ag;
globalThis.Ag.registerIdentifier ??= (name: string) => {
	(globalThis.Ag as any)[name] = Symbol(name);
};


export default globalThis.Ag;
