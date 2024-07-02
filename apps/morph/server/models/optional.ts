export type Optional<
	Target extends object,
	Keys extends string
> = {
	[P in keyof Target as P extends Keys ? P : never]?: Target[P];
} & {
	[P in keyof Target as P extends Keys ? never : P ]: Target[P];
};
