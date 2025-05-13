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
import { supabase } from "@/lib/supabase";

export function DrawingEditor() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const editorRef = useRef<any>(null);

  const saveDrawing = async (obj: any) => {
    const editor = editorRef.current;
    if (editor) {
      const snapshot = editor.store.getSnapshot();
      const { drawings, filename, version, user_id } = {
        ...obj,
        drawings: snapshot,
      };

      const { data, error } = await supabase
        .from("ea-drawings")
        .insert([
          {
            user_id,
            filename,
            version,
            drawings,
          },
        ])
        .select();

      if (error) {
      console.error("Errore Supabase:", error.message, error.details);
      throw error;
    }

    //console.log("Disegno salvato:", data);
    }
  };

  const handleSubmit = (data: any) => {
    try {
      saveDrawing(data)
        .then(() => {
          setIsDialogOpen(false);
          toast.info("Disegno salvato!");
        })
        .catch((err) => {
          toast.error("Errore nel salvataggio del disegno");
        });

      //await handleSaveFlow(transformedData);
    } catch (error) {
      console.error("Error transforming data:", error);
      toast.error("Invalid format");
    }
  };

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
        <Tldraw
          components={components}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        />
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
                <SaveDrawingForm onSubmit={handleSubmit} />
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="save-drawing-form" disabled={false}>
                Save drawing
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
