export const createTSWorker = () => {
	return new Worker(
		new URL('./ts-compiler-worker.ts',
			import.meta.url), { type: 'module' },
	);
};
