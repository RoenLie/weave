import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import type { NewSubmission, Submission } from '@rotul/planner-entities';

import { fakeSubmissions } from './submission.fake.js';
import { SubmissionService } from './submission.service.js';


@Controller('submission')
export class SubmissionController {

	constructor(private readonly SubmissionService: SubmissionService) {}

	@Get('/:id')
	public async getSubmissionById(@Param('id') id: string) {
		const [ data ] = await this.SubmissionService.get(id);

		return data;
	}

	@Put()
	public async updateSubmissionById(@Body() submission: Submission) {
		const [ data ] = await this.SubmissionService.update(submission);

		return data;
	}

	@Post()
	public async createSubmission(@Body() submission: NewSubmission) {
		const [ data ] = await this.SubmissionService.create(submission);

		return data;
	}

	@Delete('/:id')
	public async deleSubmissionById(@Param('id') id: string) {
		const [ data ] = await this.SubmissionService.delete(id);

		return data;
	}

}

@Controller('submissions')
export class SubmissionsController {

	constructor(private readonly submissionService: SubmissionService) {}

	@Get()
	public async getSubmissions() {
		const [ data ] = await this.submissionService.getMany();

		return data;
	}


	@Get('generate')
	public async generateSubmissions(@Query('amount') amount: string) {
		const [ data ] = await this.submissionService.createMany(fakeSubmissions(Number(amount)));

		return data;
	}

	@Get('delete-all')
	public async deleteAll() {
		const [ data ] = await this.submissionService.deleteAll();

		return data;
	}


}
