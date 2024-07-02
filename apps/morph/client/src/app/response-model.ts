export interface DbResponse<T> {
	data: T;
	error: false;
	message: string;
}
