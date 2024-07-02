import { Injectable } from '@nestjs/common';
import { NewSubmission, Submission } from '@rotul/planner-entities';

import { BaseService } from '../app/base-service.js';


@Injectable()
export class SubmissionService extends BaseService<Submission, NewSubmission> {

	constructor() {
		super('submissions');
	}

}
