//import { wordcloudChart } from '../src/charts/wordcloud.ts';
import { barChart } from '../src/index.ts';

await barChart(
	{ year: 2010, count: 10 },
	{ year: 2011, count: 20 },
	{ year: 2012, count: 15 },
	{ year: 2013, count: 25 },
	{ year: 2014, count: 22 },
	{ year: 2015, count: 30 },
	{ year: 2016, count: 28 },
);

//await wordcloudChart();
