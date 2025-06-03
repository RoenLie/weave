import { exec } from 'child_process';


type Maybe<T> = readonly [data: T, error: undefined]
	| readonly [data: undefined, error: Error];


export const execPromise = async (
	cmd: string,
	onData?: (data: any) => any,
): Promise<Maybe<boolean>> => {
	try {
		const promise: Promise<boolean> = new Promise((resolve, reject) => {
			const proc = exec(cmd);
			if (onData)
				proc.stdout?.on('data', onData);
			else
				proc.stdout?.pipe(process.stdout);

			proc.on('error', (err) => reject(err));
			proc.on('exit', () => resolve(true));
		});

		return [ await promise, undefined ];
	}
	catch (error) {
		return [ undefined, error as Error ];
	}
};
