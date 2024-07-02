export interface Submission {
	department: string;
	empName: string;
	empNumber: number;
	dateOfRequest: Date;
	dateFrom: Date;
	dateTo: Date;
	days: number;
	hours: number;
	comment: string;
	denied: string;
	absenceType: AbsenceType;
	status: SubmissionStatus;
	id: string;
}

export interface NewSubmission extends Omit<Submission, 'id'> {}

export const newSubmissionEntity = (): NewSubmission => {
	return {
		department:    '',
		empName:       '',
		empNumber:     0,
		dateOfRequest: new Date(),
		dateFrom:      new Date(),
		dateTo:        new Date(),
		days:          0,
		hours:         0,
		comment:       '',
		denied:        '',
		absenceType:   ABSENCE_TYPE.HOLIDAY,
		status:        SUBMISSION_STATUS.PENDING,
	};
};


export const SUBMISSION_STATUS = {
	PENDING:  'PENDING',
	APPROVED: 'APPROVED',
	DENIED:   'DENIED',
}as const;
export type SubmissionStatus = keyof typeof SUBMISSION_STATUS

export const ABSENCE_TYPE = {
	HOLIDAY:    'HOLIDAY',
	SICK_CHILD: 'SICK_CHILD',
	SICK:       'SICK',
} as const;
export type AbsenceType = keyof typeof ABSENCE_TYPE

export type Absence = AbsenceHoliday | AbsenceSick | AbsenceSickChild;


export interface AbsenceHoliday {

	absenceType: Extract<AbsenceType, 'HOLIDAY'>;

}

export interface AbsenceSick {

	absenceType: Extract<AbsenceType, 'SICK'>;

}


export interface AbsenceSickChild {

	absenceType: Extract<AbsenceType, 'SICK_CHILD'>;
	childsAge: number;
	parentEmployer: string;
	childCaretaker: string;

}
