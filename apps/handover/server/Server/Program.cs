using Microsoft.Extensions.Diagnostics.HealthChecks;

WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

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

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment()) {
	app.MapOpenApi();
}

app.UseHttpsRedirection();

string[] summaries = [
	"Freezing", "Bracing", "Chilly", "Cool", "Mild",
	"Warm", "Balmy", "Hot", "Sweltering", "Scorching"
];

app.MapGet("/weatherforecast", () => {
	WeatherForecast[] forecast = [
		..Enumerable
		.Range(1, 5)
		.Select(index => new WeatherForecast(
			DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
			Random.Shared.Next(-20, 55),
			summaries[Random.Shared.Next(summaries.Length)]
		))
	];

	return forecast;
}).WithName("GetWeatherForecast");

app.MapHealthChecks("/health");
app.MapGet("/shutdown", () => {
	_ = Task.Run(async () => {
		await app.StopAsync();

		Environment.Exit(0);
	});
	return Results.Ok("Shutting down...");
});

app.Run();


record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary) {
	public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
