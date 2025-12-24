export function AppLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-label="UI Annotator"
      className={className}
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      viewBox="0 0 24 24"
    >
      {/* Bounding box corners */}
      <path d="M4 4h4M4 4v4" />
      <path d="M20 4h-4M20 4v4" />
      <path d="M4 20h4M4 20v-4" />
      <path d="M20 20h-4M20 20v-4" />
      {/* Memo lines */}
      <path d="M8 10h8" strokeWidth="2" />
      <path d="M8 14h5" strokeWidth="2" />
    </svg>
  );
}

export function AppLogoWithText({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <AppLogo className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
      <span className="font-bold font-mono text-neutral-800 text-sm dark:text-neutral-200">
        UI Annotator
      </span>
    </div>
  );
}
