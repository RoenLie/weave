import { Module } from '@nestjs/common';

import { JournalController } from './journal.controller.js';
import { JournalService } from './journal.service.js';


@Module({
	imports:     [],
	controllers: [ JournalController ],
	providers:   [ JournalService ],
})
export class JournalModule {}
