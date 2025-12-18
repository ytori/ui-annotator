const SPINNER_BARS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export default function Loader() {
	return (
		<div className="dot-background flex h-full items-center justify-center">
			<svg
				className="h-6 w-6 text-muted-foreground"
				viewBox="0 0 24 24"
				fill="none"
				role="img"
				aria-label="Loading"
			>
				{SPINNER_BARS.map((i) => (
					<rect
						key={i}
						x="11"
						y="1"
						width="2"
						height="5"
						rx="1"
						fill="currentColor"
						transform={`rotate(${i * 30} 12 12)`}
						style={{
							animation: "spinner-fade 1.5s linear infinite",
							animationDelay: `${-(11 - i) * (1.5 / 12)}s`,
						}}
					/>
				))}
			</svg>
			<style>{`
				@keyframes spinner-fade {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.15; }
				}
			`}</style>
		</div>
	);
}
