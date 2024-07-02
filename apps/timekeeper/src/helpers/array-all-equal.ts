export const arrayAllEqualByKey = <T extends object>(array: T[], key: keyof T) =>
	array.every((o, i) => array.slice(i).every(oo => oo[key] == o[key]));
