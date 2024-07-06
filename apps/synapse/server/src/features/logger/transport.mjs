import { join } from 'node:path/posix';
import { createStream } from 'rotating-file-stream';


const logNameGenerator = (directory) => (time, index) => {
	if (!time)
		return join(directory, 'file.log');

	const pad = (num) => (num > 9 ? '' : '0') + num;

	if (typeof time === 'number')
		time = new Date(time);

	const month = time.getFullYear() + '' + pad(time.getMonth() + 1);
	const day = pad(time.getDate());
	const hour = pad(time.getHours());
	const minute = pad(time.getMinutes());

	const file = join(directory,
		`${ month }${ day }-${ hour }${ minute }-${ index }-file.log`);

	return file;
};


export default async (options) => {
	const { size, interval, compress, directory } = options;

	const generator = logNameGenerator(directory);

	return createStream(generator, {
		size:     size || '1000B',
		interval: interval || '10m',
		compress: compress || 'gzip',
	});
};
