export const areDatesEqual = (d1: Date, d2: Date) => {
	const date1 = new Date(d1).getTime();
	const date2 = new Date(d2).getTime();

	if (date1 < date2 || date1 > date2)
		return false;

	return true;
};
