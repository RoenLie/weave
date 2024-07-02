
type ObjectFromClass<T extends new (...args: any[]) => InstanceType<T>> = {[P in keyof InstanceType<T>]: InstanceType<T>[P]};

export const Initialize = <T extends new (...args: any[]) => InstanceType<T>>(
	base: T,
	values: Partial<ObjectFromClass<T>>,
) => {
	let instance = new base();

	Object.assign(instance as object, values);

	return instance;
};
