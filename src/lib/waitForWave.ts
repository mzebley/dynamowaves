/** Subscribe before starting a morph, disposing the wait on every exit path. */
export function waitForWave(
	wave: EventTarget,
	start: () => void,
	timeout: number,
	signal: AbortSignal,
): Promise<'complete' | 'timeout' | 'aborted'> {
	if (signal.aborted) return Promise.resolve('aborted');
	return new Promise((resolve, reject) => {
		const cleanup = () => {
			clearTimeout(timer);
			wave.removeEventListener('dynamo-wave-complete', onComplete);
			signal.removeEventListener('abort', onAbort);
		};
		const finish = (result: 'complete' | 'timeout' | 'aborted') => {
			cleanup();
			resolve(result);
		};
		const onComplete = () => finish('complete');
		const onAbort = () => finish('aborted');
		const timer = setTimeout(() => finish('timeout'), timeout);
		wave.addEventListener('dynamo-wave-complete', onComplete, { once: true });
		signal.addEventListener('abort', onAbort, { once: true });
		try {
			start();
		} catch (error) {
			cleanup();
			reject(error);
		}
	});
}
