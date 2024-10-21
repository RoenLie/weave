import { output } from './output.ts';


export const barChart = async (...lines: { year: number, count: number }[]) => {
	const code = `
	import Chart from 'chart.js/auto'

	const data = ${ JSON.stringify(lines) };
	new Chart(
		document.getElementById('acquisitions'),
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
			}
		}
	);
	`;

	output(code);
};
