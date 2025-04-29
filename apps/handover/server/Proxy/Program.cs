using Proxy;
using Yarp.ReverseProxy.Configuration;


WebApplicationBuilder builder = WebApplication.CreateSlimBuilder(args);

builder.Services
	.AddReverseProxy()
	.LoadFromMemory(
		[ new() {
			RouteId = "default-route",
			ClusterId = "application-cluster",
			Match = new RouteMatch { Path = "{**catch-all}" }
		} ],
		[ new() {
			ClusterId = "application-cluster",
			Destinations = new Dictionary<string, DestinationConfig>
			{
				{
					"app-instance",
					new () { Address = $"http://localhost:{AppInstanceManager.initialPort}" }
				}
			},
		} ]
	);

// Add the instance manager service
builder.Services.AddSingleton<AppInstanceManager>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<AppInstanceManager>());

WebApplication app = builder.Build();

app.MapReverseProxy();

app.Run();
