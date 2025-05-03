import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';


export const csvToJson = async <T extends object>(path: string): Promise<T | undefined> => {
	// Create a key-value store for build variables
	const buildVars: Record<string, string> = {};

	// Use readline interface with the stream for line-by-line processing
	const lineReader = createInterface({
		input:     createReadStream(path, { encoding: 'utf-8' }),
		crlfDelay: Infinity,
	});

	// Track if we've processed the header
	let isFirstLine = true;

	try {
		for await (const line of lineReader) {
			if (isFirstLine) {
				isFirstLine = false;
				continue;
			}

			// Parse CSV line
			const [ key, value ] = line.split(',', 2);
			if (key && value)
				buildVars[key.trim()] = value.trim();
		}
	}
	catch (error) {
		console.error('Error reading CSV file:', error);

		return;
	}
	finally {
		lineReader.close();
	}

	return buildVars as T;
};
