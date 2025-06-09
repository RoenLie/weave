declare module '@babel/plugin-syntax-jsx' {
	const module: {
		default: {
			(): any;
			manipulateOptions(opts: any, parserOpts: { plugins: string[]; }): void;
		};
	};
	export default module;
}
