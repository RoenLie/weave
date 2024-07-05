import { maybeAll } from '@roenlie/core/async';
import Tesseract from 'tesseract.js';


/** Augmented scheduler with jobCount property. */
interface Scheduler extends Tesseract.Scheduler {
	/**
	 * Used by the scheduler when emptying itself from cache.
	 */
	lang: string;

	/** Scheduler keeps track of how many jobs it has performed, so that
	 * It can terminate itself at a safe point in time, once the configured
	 * limit has been reached.
	 */
	jobCount: number;

	/**
	 * Current ongoing jobs, used internally to safely terminate the scheduler
	 * when there is no longer any running jobs, and it has exceeded the
	 * configured job limit.
	 */
	currentJobs: Set<Promise<any>>;
}


const workerCount    = 2;
const jobLimit       = 100;
const schedulerCache = new Map<string, Scheduler>();


const createScheduler = async (
	workerCount: number,
	...createWorker: Parameters<typeof Tesseract.createWorker>
): Promise<Scheduler> => {
	const scheduler = Tesseract.createScheduler() as Scheduler;
	scheduler.lang = createWorker[0] as string;
	scheduler.jobCount = 0;
	scheduler.currentJobs = new Set();

	const original = scheduler.addJob;

	/* We augment the addJob functionality with a side-effect that
		terminates and removes the scheduler if it has no more ongoing
		tasks, and it exceeds the job limit. */
	scheduler.addJob = async function(this: any, ...args: Parameters<typeof original>) {
		scheduler.jobCount++;

		const result = original.call(this, ...args);
		scheduler.currentJobs.add(result);

		const awaited = await result;
		scheduler.currentJobs.delete(result);

		if (scheduler.jobCount > jobLimit && !scheduler.currentJobs.size) {
			await scheduler.terminate();
			schedulerCache.delete(scheduler.lang);
		}

		return awaited;
	} as typeof original;

	const workers: Promise<Tesseract.Worker>[] = Array(workerCount);
	for (let i = 0; i < workerCount; i++)
		workers[i] = Tesseract.createWorker(...createWorker);

	(await Promise.all(workers)).forEach(worker => scheduler.addWorker(worker));

	return scheduler;
};


const getScheduler = async (lang: string) => {
	let scheduler = schedulerCache.get(lang);

	if (!scheduler) {
		scheduler = await createScheduler(workerCount, lang);
		schedulerCache.set(lang, scheduler);
	}

	return scheduler;
};


export const performOCR = async (
	lang: string,
	images: Tesseract.ImageLike | Tesseract.ImageLike[],
) => {
	if (!Array.isArray(images))
		images = [ images ];

	const scheduler = await getScheduler(lang);
	const jobs: Promise<Tesseract.RecognizeResult>[] = Array(images.length);

	for (let i = 0; i < images.length; i++)
		jobs[i] = scheduler.addJob('recognize', images[i]!);

	return await maybeAll(jobs);
};
