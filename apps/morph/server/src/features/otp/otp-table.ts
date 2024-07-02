import type { IOneTimePassword } from '@roenlie/morph/models/otp-model.js';

import { Query } from '../sqlite/query.js';


export const createOTPtable = () => {
	using query = new Query();

	query.define<IOneTimePassword>('OTP')
		.primaryKey('opt_id')
		.column('email',      'TEXT', { value: '', nullable: false })
		.column('otp',        'TEXT', { value: '', nullable: false })
		.column('created_at', 'TEXT', { value: "(datetime('now'))", nullable: false })
		.query();
};
