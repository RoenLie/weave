import { NestFactory } from '@nestjs/core';

import { AppModule } from './modules/app/app.module.js';


if (import.meta.env.PROD) {
	const bootstrap = async () => {
		const app = await NestFactory.create(AppModule);
		await app.listen(process.env['PORT'] || 3000);
	};

	bootstrap();
}

export const viteNodeApp = NestFactory.create(AppModule, { cors: true });
