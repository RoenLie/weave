declare global {
	namespace NodeJS {
		interface ProcessEnv {
			PORT: string;
			HOST: string;
			SQLITE_URL: string;
			MAIL_HOST: string;
			MAIL_USER: string;
			MAIL_PASS: string;
			JWT_SECRET: string;
		}
	}
}

export {};
