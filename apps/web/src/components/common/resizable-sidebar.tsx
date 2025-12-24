import type { LucideIcon } from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

/** Sidebar configuration constants */
const SIDEBAR_CONFIG = {
  left: { default: 208, min: 180 },
  right: { default: 256, min: 240 },
  max: 400,
  collapsed: 40,
  animationDuration: 300,
} as const;

export interface ResizableSidebarProps {
  /** Position of the sidebar */
  position: "left" | "right";
  /** Icon to show when collapsed */
  collapsedIcon: LucideIcon;
  /** Tooltip for the collapsed icon button */
  collapsedTitle?: string;
  /** Content to render when expanded */
  children: ReactNode;
  /** External trigger to expand (e.g., when selection changes) */
  expandTrigger?: number;
}

export function ResizableSidebar({
  position,
  collapsedIcon: CollapsedIcon,
  collapsedTitle,
  children,
  expandTrigger,
}: ResizableSidebarProps) {
  const config =
    position === "left" ? SIDEBAR_CONFIG.left : SIDEBAR_CONFIG.right;
  const [width, setWidth] = useState<number>(config.default);
  const [isResizing, setIsResizing] = useState(false);
  const widthBeforeCollapse = useRef<number>(config.default);
  const prevExpandTrigger = useRef(expandTrigger);

  const isCollapsed = width === SIDEBAR_CONFIG.collapsed;
  const isExpanded = width > SIDEBAR_CONFIG.collapsed;

  // Handle resize
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) {
        return;
      }
      const newWidth =
        position === "left"
          ? Math.min(SIDEBAR_CONFIG.max, Math.max(config.min, e.clientX))
          : Math.min(
              SIDEBAR_CONFIG.max,
              Math.max(config.min, window.innerWidth - e.clientX)
            );
      setWidth(newWidth);
    },
    [isResizing, position, config.min]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Double-click to toggle
  const toggle = useCallback(() => {
    if (isCollapsed) {
      setWidth(widthBeforeCollapse.current);
    } else {
      widthBeforeCollapse.current = width;
      setWidth(SIDEBAR_CONFIG.collapsed);
    }
  }, [isCollapsed, width]);

  // Expand when trigger changes (e.g., selection)
  useEffect(() => {
    if (
      expandTrigger !== undefined &&
      expandTrigger !== prevExpandTrigger.current &&
      expandTrigger > 0 &&
      isCollapsed
    ) {
      setWidth(widthBeforeCollapse.current);
    }
    prevExpandTrigger.current = expandTrigger;
  }, [expandTrigger, isCollapsed]);

  // Only animate when not being dragged
  const shouldAnimate = !isResizing;

  const sidebarContent = (
    <div
      className={cn(
        "relative shrink-0 bg-background",
        position === "left" ? "border-r" : "border-l"
      )}
      style={{
        width,
        transition: shouldAnimate
          ? `width ${SIDEBAR_CONFIG.animationDuration}ms ease-linear`
          : "none",
      }}
    >
      {/* Collapsed state */}
      {isCollapsed && (
        <div className="flex h-full flex-col items-center py-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={toggle}
            title={collapsedTitle}
            type="button"
          >
            <CollapsedIcon className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Expanded state */}
      {isExpanded && (
        <div className="h-full w-full overflow-hidden">{children}</div>
      )}
    </div>
  );

  const resizeHandle = (
    // biome-ignore lint/a11y/noStaticElementInteractions: Resize handle uses mouse interactions intentionally
    <div
      className={cn(
        "group relative z-20 w-1 shrink-0 select-none transition-colors",
        isCollapsed ? "cursor-pointer" : "cursor-col-resize",
        isResizing ? "bg-ring" : "bg-transparent hover:bg-ring"
      )}
      onDoubleClick={toggle}
      onMouseDown={(e) => {
        e.preventDefault();
        if (!isCollapsed) {
          setIsResizing(true);
        }
      }}
      title={
        isCollapsed
          ? "Double-click to expand"
          : "Drag to resize, double-click to collapse"
      }
    >
      {/* Visual indicator on hover */}
      <div
        className={cn(
          "absolute inset-y-0 -right-1 -left-1 transition-colors",
          isResizing ? "bg-ring/20" : "bg-transparent group-hover:bg-ring/20"
        )}
      />
    </div>
  );

  // Left: sidebar then handle, Right: handle then sidebar
  return position === "left" ? (
    <>
      {sidebarContent}
      {resizeHandle}
    </>
  ) : (
    <>
      {resizeHandle}
      {sidebarContent}
    </>
  );
}
