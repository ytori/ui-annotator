import {
  Component,
  FileUp,
  FolderOpen,
  Menu,
  Save,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import {
  GithubMenuItems,
  ThemeMenuItems,
} from "@/components/common/menu-items";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface EditorMenuProps {
  hasProject: boolean;
  onOpen: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onImportComponentLibrary?: () => void;
  onClear: () => void;
}

export function EditorMenu({
  hasProject,
  onOpen,
  onSave,
  onExport,
  onImportComponentLibrary,
  onClear,
}: EditorMenuProps) {
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClear = () => {
    setShowClearDialog(false);
    onClear();
  };

  return (
    <>
      <AlertDialog onOpenChange={setShowClearDialog} open={showClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the current project? Unsaved
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleClear}
            >
              Clear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="h-8 w-8" size="icon" variant="ghost">
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Open/Save */}
          <DropdownMenuItem onClick={onOpen}>
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </DropdownMenuItem>
          {hasProject && (
            <DropdownMenuItem onClick={onSave}>
              <Save className="mr-2 h-4 w-4" />
              Save As
            </DropdownMenuItem>
          )}
          {/* Export for AI */}
          {hasProject && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onExport}>
                <FileUp className="mr-2 h-4 w-4" />
                Export for AI
              </DropdownMenuItem>
            </>
          )}
          {/* Components */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onImportComponentLibrary}>
            <Component className="mr-2 h-4 w-4" />
            Components
          </DropdownMenuItem>
          {hasProject && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setShowClearDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Project
              </DropdownMenuItem>
            </>
          )}
          <ThemeMenuItems />
          <GithubMenuItems />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
