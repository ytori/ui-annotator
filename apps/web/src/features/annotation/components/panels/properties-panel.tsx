import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNorm, roundPixel } from "@/lib/geometry";
import { cn } from "@/lib/utils";
import type { ElementColor } from "@/types";
import type { ComponentSpec } from "@/types/component";
import { ELEMENT_COLORS } from "../../constants/colors";
import {
  selectFirstSelectedElement,
  useAnnotationStore,
  useUIStore,
} from "../../store";

/** Coordinate grid display for bbox values */
function CoordinateGrid({
  label,
  values,
}: {
  label: string;
  values: {
    x: string | number;
    y: string | number;
    w: string | number;
    h: string | number;
  };
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-muted-foreground text-xs">{label}</Label>
      <div className="grid grid-cols-2 gap-1 font-mono text-xs">
        {(["x", "y", "w", "h"] as const).map((key) => (
          <div
            className="rounded border border-input bg-muted/50 px-2 py-1.5 text-muted-foreground"
            key={key}
          >
            {key.toUpperCase()}: {values[key]}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Delete button styles */
const DELETE_BUTTON_CLASS =
  "w-full text-destructive hover:text-destructive hover:bg-destructive/10";

/**
 * Props for component editor render prop
 */
export interface ComponentEditorProps {
  value: ComponentSpec | undefined;
  onValueChange: (spec: ComponentSpec | null) => void;
}

/**
 * Props for PropertiesPanel
 */
export interface PropertiesPanelProps {
  /**
   * Render prop for component editor
   * Injected from outside to avoid dependency on component-catalog
   */
  renderComponentEditor?: (props: ComponentEditorProps) => ReactNode;
  /** Show header with title. Default: true (for desktop sidebar) */
  showHeader?: boolean;
  /** Called after element is deleted (used to close sheet on mobile) */
  onDeleted?: () => void;
}

export function PropertiesPanel({
  renderComponentEditor,
  showHeader = true,
  onDeleted,
}: PropertiesPanelProps) {
  const selectedElement = useAnnotationStore(selectFirstSelectedElement);
  const updateElement = useAnnotationStore((state) => state.updateElement);
  const deleteSelectedElements = useAnnotationStore(
    (state) => state.deleteSelectedElements
  );
  const labelFocusTrigger = useUIStore((state) => state.labelFocusTrigger);

  const labelInputRef = useRef<HTMLInputElement>(null);

  // Focus label input when triggered by double-click
  useEffect(() => {
    if (labelFocusTrigger > 0 && labelInputRef.current) {
      labelInputRef.current.focus();
      labelInputRef.current.select();
    }
  }, [labelFocusTrigger]);

  const handleDelete = useCallback(() => {
    deleteSelectedElements();
    onDeleted?.();
  }, [deleteSelectedElements, onDeleted]);

  if (!selectedElement) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-muted-foreground text-sm">
        Select an element to edit
      </div>
    );
  }

  const handleLabelChange = (value: string) => {
    updateElement(selectedElement.id, { label: value });
  };

  const handleComponentChange = (spec: ComponentSpec | null) => {
    updateElement(selectedElement.id, { component: spec });
  };

  const handleNotesChange = (notes: string) => {
    updateElement(selectedElement.id, { notes });
  };

  const handleColorChange = (color: ElementColor) => {
    updateElement(selectedElement.id, { color });
  };

  const pixel = roundPixel(selectedElement.bbox.pixel);
  const norm = formatNorm(selectedElement.bbox.norm);

  // Mobile uses confirmation dialog, desktop uses direct delete
  const deleteButton = showHeader ? (
    <Button
      className={DELETE_BUTTON_CLASS}
      onClick={handleDelete}
      size="sm"
      variant="outline"
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Delete
    </Button>
  ) : (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className={DELETE_BUTTON_CLASS} size="sm" variant="outline">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete annotation?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            onClick={handleDelete}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const content = (
    <>
      {/* Label */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs" htmlFor="label">
          Label
        </Label>
        <Input
          className="h-8 text-sm"
          id="label"
          onChange={(e) => handleLabelChange(e.target.value)}
          placeholder="What is this element?"
          ref={labelInputRef}
          value={selectedElement.label}
        />
      </div>

      {/* Component Editor (injected via render prop) */}
      {renderComponentEditor?.({
        value: selectedElement.component,
        onValueChange: handleComponentChange,
      })}

      {/* Notes - Optional */}
      <div className="space-y-1.5">
        <Label className="text-muted-foreground text-xs" htmlFor="notes">
          Notes
        </Label>
        <Textarea
          className="h-[7.5rem] resize-none overflow-y-auto text-sm"
          id="notes"
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Additional context for AI..."
          value={selectedElement.notes ?? ""}
        />
      </div>

      {/* Tag & Position - Accordion */}
      <Accordion className="w-full" type="multiple">
        <AccordionItem className="border-b-0" value="tag">
          <AccordionTrigger>Tag</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-1.5 p-1">
              {ELEMENT_COLORS.map((color) => (
                <button
                  className={cn(
                    "h-6 w-6 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-background",
                    selectedElement.color === color.id ||
                      (!selectedElement.color && color.id === "blue")
                      ? "ring-2 ring-offset-1 ring-offset-background"
                      : "opacity-50 hover:opacity-100"
                  )}
                  key={color.id}
                  onClick={() => handleColorChange(color.id)}
                  style={{
                    backgroundColor: color.cssVar,
                    ["--tw-ring-color" as string]: color.cssVar,
                  }}
                  title={color.label}
                  type="button"
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem className="border-b-0" value="position">
          <AccordionTrigger>Position</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3">
              <CoordinateGrid label="Pixel" values={pixel} />
              <CoordinateGrid label="Normalized" values={norm} />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="pt-2">{deleteButton}</div>
    </>
  );

  // Mobile (drawer): simple content, parent handles scrolling
  if (!showHeader) {
    return <div className="space-y-4 p-3">{content}</div>;
  }

  // Desktop (sidebar): own scroll container
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-3 py-2">
        <span className="font-medium text-muted-foreground text-xs">
          Properties
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {content}
      </div>
    </div>
  );
}
