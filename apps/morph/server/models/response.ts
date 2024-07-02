export interface MResponse<T> {
	data: T | undefined;
	error: boolean;
	message: string;
}
