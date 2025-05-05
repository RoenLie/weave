using Core.Plugin;
using Microsoft.Extensions.Diagnostics.HealthChecks;


WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment()) {
	// Add services to the container.
	// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
	builder.Services.AddOpenApi();
}

builder.LoadAndInitializePlugins(builder.Environment.IsDevelopment());

builder.Services.AddHealthChecks()
	.AddCheck("Database", () => {
		// Check database connection
		return new(HealthStatus.Healthy) { };
	})
	.AddCheck("Plugin System", () => {
		// Check plugin system health
		return new(HealthStatus.Healthy) { };
	});

WebApplication app = builder.Build();

app.ConfigurePlugins();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
	app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapHealthChecks("/health");
app.MapGet("/shutdown", () => {
	_ = Task.Run(async () => {
		await app.StopAsync();

		Environment.Exit(0);
	});
	return Results.Ok("Shutting down...");
});

app.Run();

