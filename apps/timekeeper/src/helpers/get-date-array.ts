export const getDateArray = (start: Date, end: Date) => {
	const arr: Date[] = [];
	let dt = start;
	while (dt <= end) {
		arr.push(new Date(dt));
		dt.setDate(dt.getDate() + 1);
	}

	return arr;
};


export const getTemporalDateArray = (start: Temporal.PlainDate, end: Temporal.PlainDate) => {
	if (start.equals(end))
		return [ start ];

	const arr: Temporal.PlainDate[] = [];
	let dt = start;
	let dur = dt.until(end).days;

	while (dur > 0) {
		arr.push(dt);
		dt = dt.add({ days: 1 });
		dur -= 1;
	}

	arr.push(dt);

	return arr;
};
