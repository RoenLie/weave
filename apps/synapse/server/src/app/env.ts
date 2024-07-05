declare global {
	namespace NodeJS {
		interface ProcessEnv {
			URL: string;
		}
	}
}

export {};
