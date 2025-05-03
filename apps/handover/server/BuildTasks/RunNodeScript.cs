using Microsoft.Build.Framework;
using System.Diagnostics;

namespace BuildTasks;


public partial class RunNodeScript : MSBuildTask {

	[Required] public string Dir { get; set; } = "";
	[Required] public string File { get; set; } = "";
	public string Args { get; set; } = "";

	public override bool Execute() {
		Log.LogMessage(MessageImportance.High, $"Running NodeJS script with: {Dir} and {File}");

		GetBuildProperties();

		string scriptPath = Path.Combine(Dir, File);
		if (!System.IO.File.Exists(scriptPath)) {
			Log.LogError($"Script file not found: {scriptPath}");
			return false;
		}

		// Construct arguments - include script path and any additional args
		string arguments = $"\"{scriptPath}\" {Args}".Trim();

		using var process = new Process();
		process.StartInfo = new ProcessStartInfo {
			FileName = "node",
			Arguments = arguments,
			WorkingDirectory = Dir,
			UseShellExecute = false,
			RedirectStandardOutput = true,
			RedirectStandardError = true,
			CreateNoWindow = true
		};

		process.OutputDataReceived += (sender, e) => {
			if (!string.IsNullOrEmpty(e.Data))
				Log.LogMessage(MessageImportance.High, e.Data);
		};

		process.ErrorDataReceived += (sender, e) => {
			if (!string.IsNullOrEmpty(e.Data))
				Log.LogError(e.Data);
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

			Log.LogMessage(MessageImportance.High, "Script executed successfully");

			return true;
		}
		catch (System.ComponentModel.Win32Exception ex) {
			Log.LogError($"Failed to start Node.js: {ex.Message}. Is Node.js installed and in your PATH?");

			return false;
		}
	}
}
