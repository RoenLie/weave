export const createResponse = <T>(data: T | undefined, errorMessage: string) =>  {
	const response: {
		data: T | undefined;
		error: boolean;
		message: string;
	} = {
		data,
		error:   !data,
		message: !data ? errorMessage : '',
	};

	return response;
};
