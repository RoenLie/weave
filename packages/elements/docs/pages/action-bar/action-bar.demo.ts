import { MMActionBar } from '@roenlie/elements/action-bar';
import { MMButton } from '@roenlie/elements/button';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

MMActionBar.register();
MMButton.register();


@customElement('mm-action-bar-demo')
export class ActionBarDemo extends LitElement {

	protected override render(): unknown {
		return html`
		<mm-action-bar>
			<mm-button>ACTION!1</mm-button>
			<mm-button>ACTION!2</mm-button>
			<mm-button>ACTION!3</mm-button>
			<mm-button>ACTION!4</mm-button>
			<mm-button>ACTION!5</mm-button>
			<mm-button>ACTION!6</mm-button>
			<mm-button>ACTION!7</mm-button>
			<mm-button>ACTION!8</mm-button>
			<mm-button>ACTION!9</mm-button>
			<mm-button>ACTION!10</mm-button>
			<mm-button>ACTION!11</mm-button>
			<mm-button>ACTION!12</mm-button>
			<mm-button>ACTION!13</mm-button>
			<mm-button>ACTION!14</mm-button>
			<mm-button>ACTION!15</mm-button>
			<mm-button>ACTION!16</mm-button>
			<mm-button>ACTION!17</mm-button>
			<mm-button>ACTION!18</mm-button>
			<mm-button>ACTION!19</mm-button>
		</mm-action-bar>
		`;
	}

	public static override styles = [
		sharedStyles,
		css`
		:host {
			display: grid;
		}
		mm-action-bar {
			height: 50px;
			width: 300px;
		}
		`,
	];

}
