# Your first page!
Here we will create the page component which the router we previously made will render when going to the `/` route.

Start off by creating a new file called home.cmp.ts in your src directory.

This will be a `AppComponent` as we want this page to be connected to the plugin system.
Thus it will require a similar, but slightly different setup from our `AppElement`.

Flex-Framework has been created in a way as to make it as close to LitElement standards
as we can, while still enabling the plugin/extension type of capabilities that we need.

Most decorators that you need will be importable from flex-framework. If not, the export comming from `lit` will most likely work.


## The home page
First we will create the home page, which is the page accessed from the root url.
* Create a new folder in the src directory named pages.
* Create a new file in the pages directory named home.cmp.ts

```typescript
// /src/pages/home.cmp.ts

import { AppComponent, Adapter } from '@eye-share/flex-framework';
import { customElement } from '@eye-share/flex-framework/decorators';
import { css, html } from 'lit';


@customElement('es-home')
export class HomeCmp extends AppComponent {

	/*
	When using an AppComponent, we need to specify how it will connect to a scope,
	and which adapter it should use.
	*/
	constructor() {
		super({
			type: 'defined',
			scope: 'root.home',
			adapter: HomeAdapter,
		})
	}

}


/*
When we use a `AppComponent` we also need to use an adapter.
This is because the adapter abstraction allows us to perform any async preperation
of plugins within the normal component code, and not run the adapter before we know
all async code is completed.
Thus allowing us to not have to worry about awaiting certain bound plugin code.
*/
export class HomeAdapter extends Adapter<HomeCmp> {

	public override render() {
		return html`
		<div>
			Welcome to the Home page!
		</div>
		`
	}

	public static override styles = css`
	:host {
		display: grid;
		place-items: center;
	}
	`;

}
```


## Settings page
So that we have something to navigate between, we will create a second page called settings.\
Start by creating a new file in the pages directory named settings.cmp.ts

```typescript
// /src/pages/settings.cmp.ts

import { AppComponent, Adapter } from '@eye-share/flex-framework';
import { customElement } from '@eye-share/flex-framework/decorators';
import { css, html } from 'lit';


@customElement('es-settings')
export class SettingsCmp extends AppComponent {

	constructor() {
		super({
			type: 'defined',
			scope: 'root.settings',
			adapter: SettingsAdapter,
		})
	}

}

export class SettingsAdapter extends Adapter<SettingsCmp> {

	public override render() {
		return html`
		<div>
			Here are the settings!
		</div>
		`
	}

	public static override styles = css`
	:host {
		display: grid;
		place-items: center;
	}
	`;

}
```


## What now?
We will go into further detail on how adapters work and what they can do in future examples.\
For now, you should be able to start your dev server and navigate to the `/` route to see your
application in action.

To start the dev server, from the root of your project run the following command:
```shell
pnpm dev
```

This will run the `dev` script that we created in our package.json.

## Next steps
Next up you have a decision to make.\
If you want to learn more about how the different pieces of Flex-Framework function.
[Click here](/300.Components/1.Components)\
If you would rather continue building on the application we just created.
[Click here](/700.Continue_building/1.Your_first_plugin)

<br><br>