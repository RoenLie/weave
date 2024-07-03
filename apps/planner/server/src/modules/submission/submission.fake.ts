import { faker } from '@faker-js/faker';
import { randomElement } from '@roenlie/core/array';
import { domId } from '@roenlie/core/dom';
import { ABSENCE_TYPE, AbsenceType, Submission, SUBMISSION_STATUS, SubmissionStatus } from '@rotul/planner-entities';


export const fakeSubmissions = (amount: number) => Array.from({ length: amount }).map((): Submission => {
	const dates: Date[] = faker.date.betweens('2022-12-01T00:00:00.000Z', '2023-01-01T00:00:00.000Z', 2);
	const days = ((dates[1]!.valueOf() - dates[0]!.valueOf()) / (24 * 60 * 60 * 1000));
	const hours = Math.round((days - Math.floor(days)) * 24);

	let dateOfRequest = new Date;
	dateOfRequest.setDate(dates[0]!.getDate());
	dateOfRequest.setMonth(dateOfRequest.getMonth() - 1);


	return 	{
		empName:       faker.name.fullName(),
		empNumber:     Math.floor(Math.random() * 25000),
		dateFrom:      dates[0]!,
		dateTo:        dates[1]!,
		days:          Math.floor(days),
		hours:         hours,
		denied:        faker.lorem.words(3),
		department:    faker.commerce.department(),
		comment:       faker.lorem.words(3),
		dateOfRequest: dateOfRequest,
		absenceType:   randomElement(Object.keys(ABSENCE_TYPE)) as AbsenceType,
		status:        randomElement(Object.keys(SUBMISSION_STATUS)) as SubmissionStatus,
		id:            'hei',
	};
});
