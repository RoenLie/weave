export interface JournalEntry {
	readonly id: string;
	readonly createdBy: string;
	readonly createdOn: string;
	readonly documentId: string;
	type: 'chat' | 'status';
	message: string;
}


export interface NewJournalEntry extends Writeable<Omit<JournalEntry, 'id'>> {}


export const newJournalEntry = (
	values: Partial<NewJournalEntry>
	& Pick<NewJournalEntry, 'documentId' | 'createdOn' | 'createdBy' | 'type' | 'message'>,
): NewJournalEntry => {
	return {
		...values,
	};
};


type Writeable<T> = {
	-readonly [P in keyof T]: T[P];
};
