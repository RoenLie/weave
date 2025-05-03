namespace BuildTasks;


public partial class ExposeBuildProps : MSBuildTask {

	public override bool Execute() {
		GetBuildProperties();

		return true;
	}
}
