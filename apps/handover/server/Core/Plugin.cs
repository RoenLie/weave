
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

namespace Core;

public interface IPlugin {
	string Name { get; }
	void Initialize(IServiceCollection services);
	void Configure(IApplicationBuilder app);
}
