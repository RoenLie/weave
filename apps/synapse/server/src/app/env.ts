declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PORT:       string;
			HOST:       string;
			SQLITE_URL: string;
		}
	}
}

export {};
