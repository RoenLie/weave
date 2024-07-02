export const stringInsert = (string: string, index: number, text: string) => {
	let strArr = String(string).split('');
	strArr.splice(index, 0, text);

	return strArr.join('');
};
