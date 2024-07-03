import { Injectable } from '@nestjs/common';
import { maybe } from '@roenlie/core/async';
import { JournalEntry, NewJournalEntry, newJournalEntry } from '@rotul/planner-entities';

import { BaseService } from '../app/base-service.js';


@Injectable()
export class JournalService extends BaseService<JournalEntry, NewJournalEntry> {

	constructor() {
		super('journal_entries');
	}

	public async getByDocID(id: string) {
		await this.ready;

		const promise = this.container.items.query({
			query: `SELECT * FROM vault v
                 WHERE v._collection=@collection AND v.documentId=@documentId`,
			parameters: [
				{ name: '@collection', value: this.collectionId },
				{ name: '@documentId', value: id },
			],
		}).fetchAll();

		return maybe<JournalEntry[]>(promise.then(({ resources }) => resources));
	}

	public async createJournalEntry(
		docId: string,
		message: string,
		type: JournalEntry['type'],
	) {
		await this.ready;

		const entry = newJournalEntry({
			createdBy:  'system',
			createdOn:  new Date().toString(),
			documentId: docId,
			type,
			message,
		});

		const [ , createError ] = await this.create(entry);
		if (createError)
			return [ null, createError ] as [data: null, error: string | null];

		return this.getByDocID(docId);
	}

}
