import { type ReactNode, type TouchEvent, useCallback } from "react";

interface ScrollableDrawerContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Scrollable content area for use inside vaul Drawers.
 *
 * Vaul intercepts touch events at the document level for drag-to-dismiss.
 * This component stops touch event propagation to allow native scrolling
 * within the drawer content.
 */
export function ScrollableDrawerContent({
  children,
  className = "",
}: ScrollableDrawerContentProps) {
  const handleTouch = useCallback((e: TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
  }, []);

  return (
    <div
      className={`flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)] ${className}`}
      onTouchMove={handleTouch}
      onTouchStart={handleTouch}
      style={{ touchAction: "pan-y" }}
    >
      {children}
    </div>
  );
}
