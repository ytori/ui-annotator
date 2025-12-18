/**
 * Throttle and Debounce Utilities
 *
 * Lightweight implementations for rate-limiting function calls.
 */

/**
 * Throttle options
 */
export interface ThrottleOptions {
	/** Call on the leading edge (default: true) */
	leading?: boolean;
	/** Call on the trailing edge (default: true) */
	trailing?: boolean;
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per specified wait period.
 *
 * @param fn - The function to throttle
 * @param wait - The number of milliseconds to throttle
 * @param options - Throttle options
 * @returns Throttled function
 *
 * @example
 * const throttled = throttle((x: number) => console.log(x), 100);
 * throttled(1); // logs 1 immediately (leading)
 * throttled(2); // ignored
 * throttled(3); // logs 3 after 100ms (trailing)
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function requires any for flexibility
export function throttle<T extends (...args: any[]) => any>(
	fn: T,
	wait: number,
	options: ThrottleOptions = {},
): T {
	const { leading = true, trailing = true } = options;

	let timeoutId: ReturnType<typeof setTimeout> | null = null;
	let lastCallTime = 0;
	// biome-ignore lint/suspicious/noExplicitAny: Parameters type inference
	let lastArgs: any[] | null = null;

	// biome-ignore lint/suspicious/noExplicitAny: Parameters type inference
	const invoke = (args: any[]) => {
		lastCallTime = Date.now();
		fn(...args);
	};

	// biome-ignore lint/suspicious/noExplicitAny: Parameters type inference
	const throttled = (...args: any[]) => {
		const now = Date.now();
		const elapsed = now - lastCallTime;

		// Store latest args for trailing call
		lastArgs = args;

		if (elapsed >= wait) {
			// Enough time has passed
			if (timeoutId) {
				clearTimeout(timeoutId);
				timeoutId = null;
			}

			if (leading) {
				invoke(args);
				lastArgs = null;
			}
		}

		// Schedule trailing call if not already scheduled
		if (trailing && !timeoutId) {
			const remaining = wait - elapsed;
			timeoutId = setTimeout(
				() => {
					timeoutId = null;
					if (lastArgs) {
						invoke(lastArgs);
						lastArgs = null;
					}
				},
				Math.max(remaining, 0),
			);
		}
	};

	return throttled as T;
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait period has elapsed since the last call.
 *
 * @param fn - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function with a cancel method
 *
 * @example
 * const debounced = debounce((x: number) => console.log(x), 100);
 * debounced(1); // schedules
 * debounced(2); // reschedules
 * debounced(3); // reschedules, logs 3 after 100ms
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic function requires any for flexibility
function _debounce<T extends (...args: any[]) => any>(
	fn: T,
	wait: number,
): T & { cancel: () => void } {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	// biome-ignore lint/suspicious/noExplicitAny: Parameters type inference
	const debounced = (...args: any[]) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
		timeoutId = setTimeout(() => {
			timeoutId = null;
			fn(...args);
		}, wait);
	};

	debounced.cancel = () => {
		if (timeoutId) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	};

	return debounced as T & { cancel: () => void };
}
