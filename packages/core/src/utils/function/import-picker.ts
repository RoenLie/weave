export const importPicker = <T extends () => Promise<any>>(imp: T) =>
	(exp: keyof Awaited<ReturnType<T>>) => () => imp().then(m => m[exp]);
