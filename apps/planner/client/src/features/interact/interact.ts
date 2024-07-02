import { deepmerge } from 'deepmerge-ts';


type ResponseData<T> = T;


export class Interact {

	private static _backendUrl = __SERVER_URL;
	private static _sharedOptions: RequestInit = {
		//credentials: 'include',
	};

	private static _getOptions: RequestInit = { method: 'GET' };

	private static _putOptions: RequestInit = {
		method:  'PUT',
		headers: {
			'Accept':       'application/json, text/plain, */*',
			'Content-Type': 'application/json',
		},
	};

	private static _postOptions: RequestInit = {
		method:  'POST',
		headers: {
			'Accept':       'application/json, text/plain, */*',
			'Content-Type': 'application/json',
		},
	};

	private static _deleteOptions: RequestInit = { method: 'DELETE' };

	private static _fetchWrapper = async <T>(url: string, options: RequestInit) =>
		fetch(Interact._backendUrl + url, options)
			.then(Interact._checkStatus)
			.then((r) => Interact._parseJSON<T>(r, options));

	private static _checkStatus(res: Response) {
		if (res.ok)
			return res;
		else
			throw new Error(res.statusText);
	}

	private static async _parseJSON<T>(res: Response, _config: RequestInit): Promise<ResponseData<T>> {
		const isJson = res.headers.get('content-type')?.includes('application/json');
		const data = isJson ? await res.json() : await res.text();

		return data;
	}

	public static async get<T = unknown>(url: string, options?: RequestOptions['get']): Promise<ResponseData<T>> {
		const _options: RequestInit = deepmerge(
			Interact._sharedOptions,
			Interact._getOptions,
			{ headers: options?.queryParams || {} },
		);

		return Interact._fetchWrapper<T>(url, _options);
	}

	public static async put<TOut = unknown, TIn = unknown>(url: string, options?: RequestOptions<TOut>['put']): Promise<ResponseData<TIn>> {
		const _options: RequestInit = deepmerge(
			Interact._sharedOptions,
			Interact._putOptions,
			{
				headers: options?.queryParams || {},
				body:    JSON.stringify(options?.data),
			},
		);

		return Interact._fetchWrapper<TIn>(url, _options);
	}

	public static async post<TOut = unknown, TIn = unknown>(url: string, options?: RequestOptions<TOut>['post']): Promise<ResponseData<TIn>> {
		const _options: RequestInit = deepmerge(
			Interact._sharedOptions,
			Interact._postOptions,
			{
				headers: options?.queryParams || {},
				body:    JSON.stringify(options?.data),
			},
		);

		return Interact._fetchWrapper<TIn>(url, _options);
	}

	public static async delete<T = unknown>(url: string, options?: RequestOptions['delete']): Promise<ResponseData<T>> {
		const _options: RequestInit = deepmerge(
			Interact._sharedOptions,
			Interact._deleteOptions,
			{ headers: options?.queryParams || {} },
		);

		return Interact._fetchWrapper<T>(url, _options);
	}

}


interface RequestOptions<T = Record<string, any>> {
	get: {
		queryParams?: Record<string, string>;
	};
	put: {
		queryParams?: Record<string, string>;
		data?: T;
	};
	post: {
		queryParams?: Record<string, string>;
		data?: T;
	};
	delete: {
		queryParams?: Record<string, string>;
	};
}
