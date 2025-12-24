import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { ScrollableDrawerContent } from "@/components/ui/scrollable-drawer-content";

export interface BaseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

/**
 * Base sheet component for mobile bottom sheets
 * Provides consistent styling and behavior across all sheets
 */
export function BaseSheet({
  open,
  onOpenChange,
  title,
  children,
}: BaseSheetProps) {
  return (
    <Drawer
      onOpenChange={onOpenChange}
      open={open}
      // Disable vaul's background scaling and input repositioning
      // to prevent rendering issues when iOS virtual keyboard opens
      repositionInputs={false}
      shouldScaleBackground={false}
    >
      {/* Use dvh for dynamic viewport height that adjusts with keyboard */}
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="flex flex-row items-center justify-between border-b pb-2">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerClose asChild>
            <Button className="h-8 w-8" size="icon" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <ScrollableDrawerContent>{children}</ScrollableDrawerContent>
      </DrawerContent>
    </Drawer>
  );
}
