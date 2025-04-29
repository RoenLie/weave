using System.Diagnostics;
using System.Reflection.Metadata;
using Yarp.ReverseProxy.Configuration;

namespace Proxy;


public class AppInstanceManager(
	ILogger<AppInstanceManager> logger,
	IConfiguration config,
	InMemoryConfigProvider proxyConfigProvider
) : BackgroundService {

	public const int initialPort = 5001;

	private readonly ILogger<AppInstanceManager> _logger = logger;
	private readonly IConfiguration _config = config;
	private readonly InMemoryConfigProvider _proxyConfigProvider = proxyConfigProvider;
	private Process? _activeProcess;
	private int _activePort = initialPort;
	private int _nextPort = initialPort + 1;
	private bool _deploymentInProgress;

	public int ActivePort => _activePort;
	public bool IsDeploymentInProgress => _deploymentInProgress;

	protected override async Task ExecuteAsync(CancellationToken stoppingToken) {
		// Start initial application instance
		await StartApplicationInstanceAsync(_activePort);

		_logger.LogInformation("Initial application instance started on port {Port}", _activePort);
	}

	private async Task StartApplicationInstanceAsync(int port) {
		ProcessStartInfo startInfo = new() {
			FileName = "dotnet",
			//Arguments = $"run --project ../Server/Server.csproj --no-build --urls=http://localhost:{port} --plugins-dir={Path.Combine(AppContext.BaseDirectory, "plugins")}",
			Arguments = $"run --project ../Server/Server.csproj --urls=http://localhost:{port} --plugins-dir={Path.Combine(AppContext.BaseDirectory, "plugins")}",
			UseShellExecute = false,
			CreateNoWindow = false
		};

		_activeProcess = Process.Start(startInfo)!;

		// Wait for app to become ready
		using HttpClient httpClient = new();
		int maxAttempts = 30;
		int attempt = 0;

		while (attempt < maxAttempts) {
			try {
				HttpResponseMessage response = await httpClient.GetAsync($"http://localhost:{port}/health");
				if (response.IsSuccessStatusCode)
					break;
			}
			catch { /* Still starting up */ }

			await Task.Delay(500);
			attempt++;
		}
	}

	public async Task<bool> DeployNewVersionAsync() {
		if (_deploymentInProgress)
			return false;

		_deploymentInProgress = true;

		try {
			_logger.LogInformation("Starting new application instance on port {Port}", _nextPort);

			// Start new instance
			await StartApplicationInstanceAsync(_nextPort);

			// Update proxy configuration
			UpdateProxyConfiguration(_nextPort);

			_logger.LogInformation("Switching traffic to new instance");

			// Keep old process reference before updating
			Process? oldProcess = _activeProcess;
			int oldPort = _activePort;

			// Update active instance info
			_activePort = _nextPort;
			// Alternate between ports
			_nextPort = _nextPort == initialPort ? initialPort + 1 : initialPort;

			// Allow time for existing requests to complete
			await Task.Delay(10000);

			// Shutdown old process
			try {
				if (oldProcess is not null && !oldProcess.HasExited) {
					using HttpClient client = new();
					await client.PostAsync($"http://localhost:{oldPort}/shutdown", null);

					// Give it time to shutdown gracefully
					await Task.Delay(5000);

					if (!oldProcess.HasExited)
						oldProcess.Kill();
				}
			}
			catch (Exception ex) {
				_logger.LogError(ex, "Error shutting down old instance");
			}

			return true;
		}
		catch (Exception ex) {
			_logger.LogError(ex, "Failed to deploy new version");

			return false;
		}
		finally {
			_deploymentInProgress = false;
		}
	}

	private void UpdateProxyConfiguration(int newPort) {
		InMemoryConfigProvider memoryConfig = _proxyConfigProvider;

		List<RouteConfig> routes = [
			new() {
				RouteId = "default-route",
				ClusterId = "application-cluster",
				Match = new RouteMatch { Path = "{**catch-all}" }
			}
		];

		List<ClusterConfig> clusters = [
			new() {
				ClusterId = "application-cluster",
				Destinations = new Dictionary<string, DestinationConfig>
				{
					{ "app-instance", new DestinationConfig { Address = $"http://localhost:{newPort}" } }
				}
			}
		];

		memoryConfig?.Update(routes, clusters);
	}

}
