import { output } from './output.ts';

//const chart  = new Chart('', {
//	type:    'line',
//	data:    [] as any,
//	options: {
//		responsive: true,
//		plugins:    {
//			title: {
//				display: true,
//				text:    'Chart.js Line Chart',
//			},
//		},
//	},
//});


export const plot = async (...lines: number[][]) => {
	output();
};


plot();
