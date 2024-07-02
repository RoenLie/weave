import { Module } from '@nestjs/common';

import { SubmissionController, SubmissionsController } from './submission.controller.js';
import { SubmissionService } from './submission.service.js';


@Module({
	imports:     [],
	controllers: [ SubmissionController, SubmissionsController ],
	providers:   [ SubmissionService ],
})
export class SubmissionModule {}
