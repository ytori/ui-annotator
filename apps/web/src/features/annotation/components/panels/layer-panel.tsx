import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { type EditorElement, getDisplayLabel } from "@/types";
import { getElementColorConfig } from "../../constants/colors";
import { useIconResolver } from "../../contexts/icon-resolver-context";
import {
  selectElements,
  selectProject,
  selectSelectedIds,
  useAnnotationStore,
  useUIStore,
} from "../../store";

export interface LayerPanelProps {
  /** Show header with title. Default: true (for desktop sidebar) */
  showHeader?: boolean;
}

export function LayerPanel({ showHeader = true }: LayerPanelProps) {
  const project = useAnnotationStore(selectProject);
  const elements = useAnnotationStore(selectElements);
  const selectedIds = useAnnotationStore(selectSelectedIds);
  const selectElement = useAnnotationStore((state) => state.selectElement);
  const reorderElements = useAnnotationStore((state) => state.reorderElements);
  const hoveredId = useUIStore((state) => state.hoveredId);
  const setHovered = useUIStore((state) => state.setHovered);
  const triggerLabelFocus = useUIStore((state) => state.triggerLabelFocus);
  const focusCanvas = useUIStore((state) => state.focusCanvas);

  // Sensors for drag-and-drop
  // - PointerSensor: mouse drag with 8px activation distance
  // - TouchSensor: touch drag (grip icon has touch-none, so no delay needed)
  // - KeyboardSensor: keyboard navigation
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Reverse elements for display (top of list = front = highest displayOrder)
  const reversedElements = useMemo(() => [...elements].reverse(), [elements]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      const oldIndex = elements.findIndex((e) => e.id === active.id);
      const newIndex = elements.findIndex((e) => e.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderElements(oldIndex, newIndex);
      }
    },
    [elements, reorderElements]
  );

  if (!project) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {showHeader && (
        <div className="border-b px-3 py-2">
          <h3 className="font-medium text-muted-foreground text-xs">
            Annotations
          </h3>
        </div>
      )}
      {/* Scroll container with touch-action: pan-y for smooth scrolling */}
      <div className="flex-1 overflow-y-auto" style={{ touchAction: "pan-y" }}>
        {reversedElements.length === 0 ? (
          <div className="p-3 text-center text-muted-foreground text-xs">
            No annotations yet
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            sensors={sensors}
          >
            <SortableContext
              items={reversedElements.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="py-1">
                {reversedElements.map((element) => (
                  <SortableLayerItem
                    element={element}
                    isHovered={hoveredId === element.id}
                    isSelected={selectedIds.includes(element.id)}
                    key={element.id}
                    onDoubleClick={triggerLabelFocus}
                    onHover={(hovering) =>
                      setHovered(hovering ? element.id : null)
                    }
                    onSelect={(addToSelection) => {
                      selectElement(element.id, addToSelection);
                      focusCanvas();
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

interface LayerItemProps {
  element: EditorElement;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (addToSelection: boolean) => void;
  onDoubleClick: () => void;
  onHover: (hovering: boolean) => void;
}

function SortableLayerItem(props: LayerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.element.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <LayerItem {...props} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

interface LayerItemInternalProps extends LayerItemProps {
  dragHandleProps?: Record<string, unknown>;
}

function LayerItem({
  element,
  isSelected,
  isHovered,
  onSelect,
  onDoubleClick,
  onHover,
  dragHandleProps,
}: LayerItemInternalProps) {
  const getIcon = useIconResolver();
  const componentName = element.component?.name;
  const ComponentIcon = getIcon(componentName);
  const colorConfig = getElementColorConfig(element.color);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Layer items use mouse/touch, keyboard works on canvas
    // biome-ignore lint/a11y/noStaticElementInteractions: Layer items use mouse/touch, keyboard works on canvas
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-1.5 px-2 py-1.5 transition-colors",
        isSelected && "bg-accent",
        !isSelected && isHovered && "bg-accent/80",
        !(isSelected || isHovered) && "hover:bg-accent/50"
      )}
      data-element-id={element.id}
      onClick={(e) => onSelect(e.shiftKey)}
      onDoubleClick={onDoubleClick}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      {/* Drag handle - touch-none prevents scroll, data-vaul-no-drag prevents drawer interference */}
      <span
        className="flex-shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
        data-vaul-no-drag
        style={{ touchAction: "none" }}
        {...dragHandleProps}
      >
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="flex-shrink-0" style={{ color: colorConfig.cssVar }}>
        <ComponentIcon className="h-3.5 w-3.5" />
      </span>
      <span
        className={cn("flex-1 truncate text-xs", isSelected && "font-medium")}
      >
        {getDisplayLabel(element)}
        {componentName && (
          <span className="ml-1 text-muted-foreground">({componentName})</span>
        )}
      </span>
    </div>
  );
}
