export const dataURItoBlob = (dataURI: string) => {
	let byteStr;
	if (dataURI.split(',')[0]!.indexOf('base64') >= 0)
		byteStr = atob(dataURI.split(',')[1]!);
	else
		byteStr = decodeURI(dataURI);

	const mimeStr = dataURI.split(',')[0]!.split(':')[1]!.split(';')[0];

	const arr = new Uint8Array(byteStr.length);
	for (let i = 0; i < byteStr.length; i++)
		arr[i] = byteStr.charCodeAt(i);

	return new Blob([ arr ], { type: mimeStr });
};
