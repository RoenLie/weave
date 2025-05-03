using Microsoft.Build.Framework;
using Microsoft.Build.Evaluation;
using System.Xml;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace BuildTasks;


public abstract partial class MSBuildTask : Microsoft.Build.Utilities.Task {

	public bool AlwaysCreateProps { get; set; } = false;

	readonly JsonSerializerOptions options = new() { WriteIndented = true };

	/// <summary>
	/// Retrieves the build properties from the project file.
	/// If AlwaysCreateProps is true, it will always create the properties file.
	/// If the properties file already exists, it will read from it instead of creating a new one.
	/// The properties are stored in a JSON file in the IntermediateOutputPath directory.
	/// </summary>
	protected Dictionary<string, string> GetBuildProperties() {
		using XmlReader projectFileReader = XmlReader.Create(BuildEngine.ProjectFileOfTaskNode);

		Project project = new(projectFileReader);
		Dictionary<string, string> propertyDictionary = [];

		string path = GetBuildPropsPath(project);

		if (!AlwaysCreateProps && File.Exists(path)) {
			Log.LogMessage(MessageImportance.High, $"Reading properties from {path}");

			return JsonSerializer
				.Deserialize<Dictionary<string, string>>(File.ReadAllText(path)) ?? [];
		}

		foreach (ProjectProperty property in project.AllEvaluatedProperties) {
			if (property.IsEnvironmentProperty)
				continue;

			//if (property.IsGlobalProperty)
			// continue;
			//if (property.IsReservedProperty)
			// continue;

			string propertyName = property.Name;
			string propertyValue = property.EvaluatedValue;

			propertyValue = MultipleSpace()
				.Replace(propertyValue, " ")
				.Replace("\r\n", " ")
				.Replace("\n", " ")
				.Replace("\r", " ");

			propertyDictionary[propertyName] = propertyValue;
		}

		if (BuildEngine is IBuildEngine10 engine) {
			foreach (var kvp in engine.GetGlobalProperties())
				propertyDictionary[kvp.Key] = kvp.Value;
		}

		using StreamWriter writer = new(path);

		string jsonString = JsonSerializer.Serialize(propertyDictionary, options);
		writer.WriteLine(jsonString);

		Log.LogMessage(MessageImportance.High, $"Writing properties to {path}");

		return propertyDictionary;
	}

	protected static string GetBuildPropsPath(Dictionary<string, string> props) => Path.Combine(
		props["ProjectDir"],
		props["IntermediateOutputPath"],
		"msbuild-properties.json"
	);

	protected static string GetBuildPropsPath(Project project) => Path.Combine(
		project.GetPropertyValue("ProjectDir"),
		project.GetPropertyValue("IntermediateOutputPath"),
		"msbuild-properties.json"
	);

	[GeneratedRegex(@"\s+")]
	protected static partial Regex MultipleSpace();
}
