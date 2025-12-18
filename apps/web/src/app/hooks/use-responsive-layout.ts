import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 640;

function subscribe(callback: () => void) {
	const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
	mq.addEventListener("change", callback);
	return () => mq.removeEventListener("change", callback);
}

function getSnapshot() {
	return window.innerWidth < MOBILE_BREAKPOINT;
}

function getServerSnapshot() {
	return false;
}

export function useResponsiveLayout() {
	const isMobile = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getServerSnapshot,
	);

	return {
		isMobile,
		isDesktop: !isMobile,
		breakpoint: MOBILE_BREAKPOINT,
	};
}
