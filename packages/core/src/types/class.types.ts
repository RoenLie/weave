type ComputedFlat<A> = { [K in keyof A]: A[K]; } & unknown
export type Ctor<T extends new(...args: any[]) => any> = ComputedFlat<T> & {
	new(...args: any[]): InstanceType<T>;
	prototype: InstanceType<T>
}
