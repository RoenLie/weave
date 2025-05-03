using Microsoft.Build.Framework;
using System.Diagnostics;

namespace BuildTasks;


public partial class RunNodeScript : MSBuildTask {

	[Required] public string Dir { get; set; } = "";
	[Required] public string File { get; set; } = "";
	public string Args { get; set; } = "";

	public override bool Execute() {
		Log.LogMessage(MessageImportance.High, $"Running NodeJS script with: {Dir} and {File}");

		var props = GetBuildProperties();

		string scriptPath = Path.Combine(Dir, File);
		if (!System.IO.File.Exists(scriptPath)) {
			Log.LogError($"Script file not found: {scriptPath}");

			return false;
		}

		string fullPropsPath = Path.Combine(Dir, GetBuildPropsPath(props));

		// Construct arguments - include script path and any additional args
		string arguments = $"\"{scriptPath}\" --build-props-path {GetBuildPropsPath(props)} {Args}".Trim();

		using Process process = new() {
			StartInfo = new() {
				FileName = "node",
				Arguments = arguments,
				UseShellExecute = false,
				RedirectStandardOutput = true,
				RedirectStandardError = true,
				CreateNoWindow = true
			}
		};

		process.OutputDataReceived += (_, ev) => {
			if (!string.IsNullOrEmpty(ev.Data))
				Log.LogMessage(MessageImportance.High, ev.Data);
		};

		process.ErrorDataReceived += (_, ev) => {
			if (!string.IsNullOrEmpty(ev.Data))
				Log.LogError(ev.Data);
		};

		try {
			process.Start();
			process.BeginOutputReadLine();
			process.BeginErrorReadLine();
			process.WaitForExit();

			if (process.ExitCode != 0) {
				Log.LogError($"Script execution failed with exit code {process.ExitCode}");

				return false;
			}
			else {
				Log.LogMessage(MessageImportance.High, "Script executed successfully");

				return true;
			}
		}
		catch (System.ComponentModel.Win32Exception ex) {
			Log.LogError($"Failed to start Node.js: {ex.Message}. Is Node.js installed and in your PATH?");

			return false;
		}
	}
}
