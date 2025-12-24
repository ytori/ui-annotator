"use client";

import { HelpCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { HelpDialog } from "./help-dialog";

/**
 * Floating help button that opens the help dialog.
 * Positioned in the bottom-right corner of the canvas area.
 * Can also be triggered by pressing the ? key.
 */
export function HelpButton() {
  const [open, setOpen] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in an input or textarea
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      (event.target instanceof HTMLElement && event.target.isContentEditable)
    ) {
      return;
    }

    // Open dialog on ? key (Shift + /)
    if (event.key === "?" || (event.shiftKey && event.key === "/")) {
      event.preventDefault();
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <div className="absolute right-4 bottom-20 z-40 md:bottom-4">
        <div className="flex size-9 items-center justify-center rounded-full border bg-background/95 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button
            className="size-7 rounded-full"
            onClick={() => setOpen(true)}
            size="icon"
            title="Help (?)"
            variant="ghost"
          >
            <HelpCircle className="size-4" />
            <span className="sr-only">Open help</span>
          </Button>
        </div>
      </div>
      <HelpDialog onOpenChange={setOpen} open={open} />
    </>
  );
}
