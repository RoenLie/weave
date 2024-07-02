type IconFile = {
	ok: true;
	status: number;
	svg: string;
} | {
	ok: false;
	status: number;
	svg: null;
};

interface IncludeFile {
	ok: boolean;
	status: number;
	html: string;
}


const includeFiles = new Map<string, Promise<IncludeFile>>();
const iconFiles = new Map<string, IconFile>();

// Load the session storage cached icons into the iconFiles map.
const localCache = JSON.parse(sessionStorage.getItem('mmde_iconcache') ?? '{}');
Object.entries(localCache).forEach(([ key, value ]) => {
	iconFiles.set(key, value as any);
});


export const requestIcon = async (url: string) => {
	if (iconFiles.has(url))
		return iconFiles.get(url)!;

	const fileData = await requestInclude(url);
	const iconFileData = {
		ok:     fileData.ok,
		status: fileData.status,
		svg:    null,
	} as IconFile;

	if (fileData.ok) {
		const div = document.createElement('div');
		div.innerHTML = fileData.html;
		const svg = div.firstElementChild;
		iconFileData.svg = svg?.tagName.toLowerCase() === 'svg' ? svg.outerHTML : '';
	}

	const localCache = JSON.parse(sessionStorage.getItem('mmde_iconcache') ?? '{}');
	localCache[url] = iconFileData;
	sessionStorage.setItem('mmde_iconcache', JSON.stringify(localCache));

	iconFiles.set(url, iconFileData);

	return iconFileData;
};


export const requestInclude = async (
	src: string,
	mode: 'cors' | 'no-cors' | 'same-origin' = 'cors',
): Promise<IncludeFile> => {
	if (includeFiles.has(src))
		return includeFiles.get(src)!;

	const fileDataPromise = fetch(src, { mode }).then(async response => {
		return {
			ok:     response.ok,
			status: response.status,
			html:   await response.text(),
		};
	});
	includeFiles.set(src, fileDataPromise);

	return fileDataPromise;
};
