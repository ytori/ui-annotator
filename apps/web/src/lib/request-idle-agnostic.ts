/**
 * Safari fallback for requestIdleCallback
 */
export const requestIdle =
	typeof requestIdleCallback !== "undefined"
		? requestIdleCallback
		: (cb: () => void) => window.setTimeout(cb, 1);

export const cancelIdle =
	typeof cancelIdleCallback !== "undefined"
		? cancelIdleCallback
		: (id: number) => window.clearTimeout(id);
