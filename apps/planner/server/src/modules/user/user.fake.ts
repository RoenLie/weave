import { faker } from '@faker-js/faker';
import { range } from '@roenlie/core/array';
import { User } from '@rotul/planner-entities';


export const generateFakeUsers = (amount: number) => {
	return range(amount).map((): User => ({
		id:         faker.datatype.uuid(),
		firstname:  faker.name.firstName(),
		middlename: faker.name.middleName(),
		lastname:   faker.name.lastName(),
		department: faker.commerce.department(),
		company:    faker.company.name(),
		username:   faker.internet.userName(),
		email:      faker.internet.email(),
		title:      faker.name.jobTitle(),
		shift:      '',
	}));
};
