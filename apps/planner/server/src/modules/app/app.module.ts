import { DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';


// Get all files which have .module.ts in them.
const moduleImports: Record<string, Record<string, DynamicModule>> = import.meta
	.glob('../**/*.module.ts', { eager: true });

// Extract the exports that contain the word module in them.
const modules = Object.values(moduleImports)
	.map(imp => Object.entries(imp)
		.filter(([ key ]) => key.toLowerCase().includes('module'))
		.map(([ , value ]) => value))
	.flat();


@Module({
	imports: [
		ThrottlerModule.forRoot({
			ttl:   60,
			limit: 60,
		}),
		...modules,
	],
	controllers: [],
	providers:   [
		{
			provide:  APP_GUARD,
			useClass: ThrottlerGuard,
		},
	],
})
export class AppModule {}
