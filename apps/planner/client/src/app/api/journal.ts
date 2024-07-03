import { maybe } from '@roenlie/core/async';
import { JournalEntry } from '@rotul/planner-entities';

import { Interact } from '../../features/interact/interact.js';


type NewChatEntry = {documentId: string; message: string;};


export class JournalApi {

	public static async getAllDocumentEntries(id: string) {
		const promise = Interact.get<JournalEntry[]>('/journal/all?documentid=' + id);

		return maybe(promise);
	}

	public static async createChatEntry(documentId: string, message: string) {
		const promise = Interact.post<NewChatEntry, JournalEntry[]>('/journal/chat', {
			data: { documentId, message },
		});

		return maybe(promise);
	}

}
