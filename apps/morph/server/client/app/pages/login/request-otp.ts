export const requestOtp = async (username: string) => {
	const url = new URL('/api/login/otp', location.origin);
	url.searchParams.set('username', username);

	const response = await fetch(url);

	return response;
};
