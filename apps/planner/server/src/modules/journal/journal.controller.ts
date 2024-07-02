import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { JournalService } from './journal.service.js';


@Controller('journal')
export class JournalController {

	constructor(private readonly journalService: JournalService) {}

	@Get('all')
	public async getAll(@Query('documentid') documentId: string) {
		if (!documentId)
			return;

		const [ data, error ] = await this.journalService
			.getByDocID(documentId);

		return data ?? error;
	}

	@Post('chat')
	public async create(@Body() entry: {
		documentId: string,
		message: string
	}) {
		const [ data, error ] = await this.journalService
			.createJournalEntry(entry.documentId, entry.message, 'chat');

		return data ?? error;
	}

}
