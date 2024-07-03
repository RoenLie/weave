export const swapItems = <T>(arr: T[], indexA: number, indexB: number): void => {
	if (indexA < 0 || indexA >= arr.length || indexB < 0 || indexB >= arr.length)
		throw new Error('Invalid index');

	[ arr[indexA], arr[indexB] ] = [ arr[indexB]!, arr[indexA]! ];
};
