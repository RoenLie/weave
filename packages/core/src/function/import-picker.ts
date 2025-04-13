export const importPicker = <T extends () => Promise<any>>(imp: T) =>
	(exp: keyof Awaited<ReturnType<T>>) => (): Promise<any> => imp().then(m => m[exp]);
