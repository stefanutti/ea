import {
  DefaultMainMenu,
  DefaultMainMenuContent,
  DefaultQuickActions,
  DefaultQuickActionsContent,
  TLComponents,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
} from "tldraw";
import "tldraw/tldraw.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SaveDrawingForm } from "./SaveDrawingForm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useEffect, useRef, useState, useCallback } from "react";

/*function SaveModal({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
	if (!open) return null

	return (
    <>
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col" aria-describedby="dialog-description">
          <DialogHeader>
            <DialogTitle>Salva disegno</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Salva disegno
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <SaveDrawingForm onSubmit={() => alert("submit")}/>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="application-form"
              disabled={false}
            >
              Save application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
	)
}*/

export function DrawingEditor() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const CustomQuickActions = () => {
    return (
      <DefaultQuickActions>
        <DefaultQuickActionsContent />
        <div>
          <TldrawUiMenuItem
            id="save"
            icon="bring-to-front"
            onSelect={() => setIsDialogOpen(true)}
            label="Save"
          />
        </div>
      </DefaultQuickActions>
    );
  };

  const components: TLComponents = {
    QuickActions: CustomQuickActions,
  };

  return (
    <>
      <div className="w-full h-full border rounded-lg bg-card overflow-hidden">
        <Tldraw components={components} />
      </div>

      <div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            className="z-[400] sm:max-w-[800px] h-auto flex flex-col"
            aria-describedby="dialog-description"
          >
            <DialogHeader>
              <DialogTitle>Save drawing</DialogTitle>
            </DialogHeader>
            <p id="dialog-description" className="sr-only">
              Save drawing
            </p>
            <ScrollArea className="flex-1 px-4">
              <div className="py-4">
                <SaveDrawingForm onSubmit={() => alert("submit")} />
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="application-form" disabled={false}>
                Save drawing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
