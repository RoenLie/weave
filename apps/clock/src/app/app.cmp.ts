import { component } from '@roenlie/lit-fabric/core';
import { useConnected } from '@roenlie/lit-fabric/hooks';
import { sharedStyles } from '@roenlie/lit-utilities/styles';
import { type Route, Router } from '@vaadin/router';
import { css, html } from 'lit';

import { Sidebar } from './sidebar.cmp.js';

Sidebar.register();


export const ClockApp = component('clock-app', element => {
	const router = new Router();
	const routes: Route[] = [
		{
			path:     '/',
			redirect: '/timer',
		},
		{
			name:      'timer',
			path:      '/timer',
			component: 'clk-timer-page',
			action:    () => void import('../timer/timer-page.cmp.js')
				.then(m => m.TimePage.register()),
		},
		{
			name:      'alarm',
			path:      '/alarm',
			component: 'clk-alarm-page',
			action:    () => void import('../alarm/alarm-page-element.js'),
		},
		{
			name:      'stopwatch',
			path:      '/stopwatch',
			component: 'clk-stopwatch-page',
			action:    () => void import('../stopwatch/stopwatch-page.cmp.js')
				.then(m => m.StopwatchPage.register()),
		},
		{
			path:     '(.*)',
			redirect: '/',
		},
	];
	const sidebarItems = [
		{
			icon:  'https://icons.getbootstrap.com/assets/icons/hourglass.svg',
			label: 'Timer',
			path:  () => router.urlForName('timer'),
		},
		{
			icon:  'https://icons.getbootstrap.com/assets/icons/bell.svg',
			label: 'Alarm',
			path:  () => router.urlForName('alarm'),
		},
		{
			icon:  'https://icons.getbootstrap.com/assets/icons/stopwatch.svg',
			label: 'Stopwatch',
			path:  () => router.urlForName('stopwatch'),
		},
	];

	useConnected(() => {
		router.baseUrl = __APP_BASE;
		router.setRoutes(routes);
		router.setOutlet(element);
	});

	return ({
		render: () => html`
		<aside>
			<clk-sidebar-element
				.items=${ sidebarItems }
			></clk-sidebar-element>
		</aside>

		<section>
			<slot></slot>
		</section>
		`,
		styles: [
			sharedStyles,
			css`
			:host {
				overflow: hidden;
				display: grid;
				grid-template-columns: 150px 1fr;
			}
			aside {
				display: grid;
				background-color: rgba(20,20,20,0.5);
				border-right: 1px solid rgb(200 200 200 / 25%);
			}
			section {
				overflow: auto;
				display: grid;
			}
			`,
		],
	});
});
