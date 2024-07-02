import { exec } from 'child_process';


export const execPromise = (cmd: string, onData?: (data: any) => any) => {
	return new Promise((resolve, reject) => {
		const proc = exec(cmd);
		if (onData)
			proc.stdout?.on('data', onData);
		else
			proc.stdout?.pipe(process.stdout);

		proc.on('error', () => reject(false));
		proc.on('exit', () => resolve(true));
	});
};
