export const shortenUrl = (libDir: string, entryDir: string, url: string) => {
	const splitPath = url.replace(/^\.+/, '').split('/').filter(Boolean);
	const splitLib = libDir.split('/').filter(Boolean);
	const splitEntry = entryDir.replace(/^\.+/, '').split('/').filter(Boolean);

	const prefix = [ ...splitLib, ...splitEntry  ].join('/');
	const path = splitPath.join('/').slice(prefix.length);

	return path;
};


export const expandUrl = (libDir: string, entryDir: string, url: string) => {
	const splitPath = url.replace(/^\.+/, '').split('/').filter(Boolean);
	const splitLib = libDir.split('/').filter(Boolean);
	const splitEntry = entryDir.replace(/^\.+/, '').split('/').filter(Boolean);

	return '/' + [ ...splitLib, ...splitEntry, ...splitPath ].join('/');
};
