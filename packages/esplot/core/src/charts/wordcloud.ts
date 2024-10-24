import { output } from '../output.ts';


export const wordcloudChart = async () => {
	const code = `
	import { Chart } from 'chart.js/auto';
	import { WordCloudController, WordElement } from 'chartjs-chart-wordcloud';

	Chart.register(WordCloudController, WordElement);

	const ctx = document.querySelector('canvas');

	new Chart(ctx, {
		type: WordCloudController.id,
		data: {
		labels:   [ 'Hello', 'world', 'normally', 'you', 'want', 'more', 'words', 'than', 'this' ],
			datasets: [
				{
					label: 'DS',
					// size in pixel
					data:  [ 90, 80, 70, 60, 50, 40, 30, 20, 10 ],
				},
			],
		}
	});
	`;

	await output(code);
};
