using Core.Plugin;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;

namespace Users;


public class UsersPlugin : IPlugin {

	public string Name => "Users";

	public void Initialize(WebApplicationBuilder builder) {
		//  services.AddScoped<IUserService, UserService>();
		//  services.AddScoped<IUserRepository, UserRepository>();
		//  services.AddScoped<IUserMapper, UserMapper>();
		//  services.AddScoped<IUserValidator, UserValidator>();
		//  services.AddScoped<IUserController, UserController>();
	}

	public void Configure(WebApplication app) {
		//  app.UseEndpoints(endpoints =>
		//  {
		//		endpoints.MapGet("/users", async context =>
		//		{
		//			 var userService = context.RequestServices.GetRequiredService<IUserService>();
		//			 var users = await userService.GetAllUsersAsync();
		//			 await context.Response.WriteAsJsonAsync(users);
		//		});
		//  });

		app.MapGet("/users", async context => {
			// var userService = context.RequestServices.GetRequiredService<IUserService>();
			// var users = await userService.GetAllUsersAsync();
			// await context.Response.WriteAsJsonAsync(users);
			await context.Response.WriteAsync("Hello from Users plugin!");
		});
	}

}
