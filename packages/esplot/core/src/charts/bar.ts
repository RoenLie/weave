import { output } from '../output.ts';


export const barChart = async (...lines: { year: number, count: number }[]) => {
	const code = `
	import Chart from 'chart.js/auto'

	const data = ${ JSON.stringify(lines) };
	new Chart(
		document.querySelector('canvas'),
		{
			type: 'bar',
			data: {
				labels: data.map(row => row.year),
				datasets: [
					{
						label: 'Acquisitions by year',
						data: data.map(row => row.count)
					}
				]
			},
			options: {
				animation: false
			},
			plugins: [{
				id: 'customAnimation',
				afterRender: (chart, args, opts) => {
					if (chart.options.animation !== false)
					return;

					chart.options.animation = true;
				}
			}]
		}
	);
	`;

	await output(code);
};
