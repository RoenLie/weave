using System.Runtime.Loader;
using System.Reflection;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Core.Plugin;


public class PluginLoader {

	public static IReadOnlyCollection<IPlugin> LoadFromReferencedAssemblies(WebApplicationBuilder builder) {
		// Get all currently loaded assemblies first
		Dictionary<string, Assembly> loadedAssemblies = GetFilteredAssemblies()
			.ToDictionary(a => a.GetName().FullName);

		// Force load the referenced assemblies from bin directory
		string? binPath = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location)
			?? throw new DirectoryNotFoundException("Could not find the bin directory.");

		// Only load assemblies that might contain plugins and aren't already loaded
		foreach (string path in Directory.GetFiles(binPath, "*.dll")) {
			// Skip system assemblies and already loaded ones
			string filename = Path.GetFileName(path);
			if (filename.StartsWith("System.", StringComparison.Ordinal) ||
				 filename.StartsWith("Microsoft.", StringComparison.Ordinal))
				continue;

			try {
				// Try to load the assembly if it's not already loaded
				AssemblyName assemblyName = AssemblyName.GetAssemblyName(path);
				if (!loadedAssemblies.ContainsKey(assemblyName.FullName)) {
					Assembly assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(path);
					loadedAssemblies[assemblyName.FullName] = assembly;
				}
			}
			// Silently ignore assemblies that can't be loaded
			catch (Exception) { }
		}

		// Do a second pass to check for any new assemblies that were loaded as dependencies
		// This is necessary because some assemblies may load other assemblies as dependencies.
		// We do this repeatedly until no new assemblies are found.
		HashSet<string> loadedNames = [.. loadedAssemblies.Keys];
		while (true) {
			List<Assembly> unloadedAssemblies = [
				.. GetFilteredAssemblies()
				.Where(a => !loadedNames.Contains(a.GetName().FullName))
			];

			foreach (Assembly assembly in unloadedAssemblies)
				loadedNames.Add(assembly.GetName().FullName);

			if (unloadedAssemblies.Count == 0)
				break;
		}

		// Get all loaded assemblies again (now including our newly loaded ones)
		IEnumerable<Assembly> assemblies = GetFilteredAssemblies();

		List<IPlugin> plugins = [];

		foreach (Assembly assembly in assemblies) {
			try {
				// Find all types implementing IPlugin
				IEnumerable<Type> pluginTypes = assembly
					.GetTypes()
					.Where(t => typeof(IPlugin)
						.IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract);

				foreach (Type pluginType in pluginTypes) {
					try {
						// Faster than Activator.CreateInstance for repeated calls
						ConstructorInfo? constructor = pluginType.GetConstructor(Type.EmptyTypes);
						if (constructor is not null) {
							IPlugin plugin = (IPlugin)constructor.Invoke(null);
							plugins.Add(plugin);

							Console.WriteLine($"Loading plugin: {plugin.Name}");
						}
					}
					catch (Exception ex) {
						Console.WriteLine($"Failed to instantiate plugin {pluginType.FullName}: {ex.Message}");
					}
				}
			}
			catch (Exception ex) {
				Console.WriteLine($"Error loading plugin from assembly {assembly.FullName}: {ex.Message}");
			}
		}

		// Store for later configuration
		builder.Services.AddSingleton(plugins as IReadOnlyCollection<IPlugin>);

		return plugins;
	}

	public static IReadOnlyCollection<IPlugin> LoadFromDirectory(string directory, WebApplicationBuilder builder) {
		// Implementation for loading plugins from physical DLLs in a directory
		// Similar to above but using Assembly.LoadFrom for each .dll file
		List<IPlugin> plugins = [];

		return plugins;
	}

	protected static IEnumerable<Assembly> GetFilteredAssemblies() {
		IEnumerable<Assembly> assemblies = AppDomain.CurrentDomain.GetAssemblies()
			.Where(a => !a.IsDynamic
				&& !(a.FullName?.StartsWith("System.", StringComparison.Ordinal) ?? false)
				&& !(a.FullName?.StartsWith("Microsoft.", StringComparison.Ordinal) ?? false));

		return assemblies;
	}

}

public static class WebApplicationExtensions {

	public static void LoadAndInitializePlugins(
		this WebApplicationBuilder builder,
		bool isDevelopment
	) {
		IReadOnlyCollection<IPlugin>? plugins = null;

		if (isDevelopment) {
			plugins = PluginLoader.LoadFromReferencedAssemblies(builder);
		}
		// In production mode, load plugins from the "plugins" directory
		else {
			var pluginsDir = Path.Combine(AppContext.BaseDirectory, "plugins");
			if (Directory.Exists(pluginsDir))
				plugins = PluginLoader.LoadFromDirectory(pluginsDir, builder);
		}

		builder.InitializePlugins(plugins);
	}

	public static void InitializePlugins(
		this WebApplicationBuilder builder,
		IReadOnlyCollection<IPlugin>? plugins
	) {
		if (plugins is null)
			return;

		foreach (var plugin in plugins) {
			try {
				Console.WriteLine($"Initializing plugin: {plugin.Name}");
				plugin.Initialize(builder);
			}
			catch (Exception ex) {
				Console.WriteLine($"Error initializing plugin {plugin.Name}: {ex.Message}");
			}
		}

		return;
	}

	public static WebApplication ConfigurePlugins(this WebApplication app) {
		IReadOnlyCollection<IPlugin>? plugins = app.Services
			.GetService<IReadOnlyCollection<IPlugin>>();

		if (plugins is null)
			return app;

		foreach (var plugin in plugins) {
			try {
				Console.WriteLine($"Configuring plugin: {plugin.Name}");
				plugin.Configure(app);
			}
			catch (Exception ex) {
				Console.WriteLine($"Error configuring plugin {plugin.Name}: {ex.Message}");
			}
		}

		return app;
	}

}
