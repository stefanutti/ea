import {
  DefaultQuickActions,
  DefaultQuickActionsContent,
  TLComponents,
  Tldraw,
  TldrawUiMenuItem,
  loadSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SaveDrawingForm } from "./SaveDrawingForm";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Save } from "lucide-react";

export function DrawingEditor() {
  const [selected, setSelected] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [drawings, setDrawings] = useState<any[]>([]);
  const editorRef = useRef<any>(null);

  useEffect(() => {
    fetchDrawings();
  }, []);

  const fetchDrawings = async () => {
    const { data, error } = await supabase.from("ea-drawings").select("*");
    if (error) {
      console.error("Errore nel recupero dei drawings:", error.message);
    } else {
      setDrawings(data);
    }
  };

  const saveDrawing = async (obj: any) => {
    const editor = editorRef.current;
    if (!editor) return;
    const snapshot = editor.store.getSnapshot();
    const { filename, version, user_id } = obj;
    const { data, error } = await supabase
      .from("ea-drawings")
      .insert([{ user_id, filename, version, drawings: snapshot }])
      .select();

    if (error) {
      console.error("Errore Supabase:", error.message, error.details);
      throw error;
    }

    return data;
  };

  const handleSubmit = (data: any) => {
    saveDrawing(data)
      .then((resp: any) => {
        fetchDrawings().then(() => {
          const newDrawing = resp[0];
          setSelected(newDrawing);
        });
        setIsDialogOpen(false);
        toast.success("Drawing saved correctly");
      })
      .catch(() => {
        toast.error("Error in saving the drawing");
      });
  };

  const SaveButton = () => (
    <DefaultQuickActions>
      <DefaultQuickActionsContent />
      <div>
        <TldrawUiMenuItem
          id="save"
          icon="bring-to-front"
          onSelect={() => setIsDialogOpen(true)}
          label="Save new drawing"
        />
      </div>
    </DefaultQuickActions>
  );

  function SelectDrawing() {
    const handleSelectChange = async (id: string) => {
      const drawing = drawings.find((d) => String(d.id) === id);
      if (!drawing) return;

      try {
        const snapshot = drawing.drawings;
        const editor = editorRef.current;

        if (editor && snapshot) {
          loadSnapshot(editor.store, snapshot);
          requestAnimationFrame(() => {
            editor.setCamera({ x: 0, y: 0, z: 1 });
            editor.zoomToFit();
          });
          toast.success("Drawing loaded");
        }

        setSelected(drawing);
      } catch (err) {
        console.error("Errore nel caricamento:", err);
        toast.error("Error loading drawing");
      }
    };

    const handleUpdateDrawing = async () => {
      const editor = editorRef.current;
      if (!selected || !editor) return;

      try {
        const snapshot = editor.store.getSnapshot();
        const { error } = await supabase
          .from("ea-drawings")
          .update({ drawings: snapshot })
          .eq("id", selected.id);

        if (error) throw error;

        toast.success("Drawing updated");
        fetchDrawings();
      } catch (err) {
        console.error("Errore aggiornamento:", err);
        toast.error("Error editing drawing");
      }
    };

    return (
      <div
        className="absolute bottom-3 right-2 z-[1000] flex flex-row items-center bg-none rounded-md"
        style={{ pointerEvents: "auto" }}
      >
        {selected && (
          <Button
            onClick={handleUpdateDrawing}
            disabled={!selected}
            className="mr-2 shadow-lg bg-white hover:bg-gray-100 text-gray-900"
          >
            <Save className="w-4 h-4 mr-2" />
            Save edit
          </Button>
        )}

        <Select
          onValueChange={handleSelectChange}
          value={selected ? String(selected.id) : undefined}
        >
          <SelectTrigger className="w-[180px] border-none shadow-lg bg-background focus:ring-0 focus:outline-none rounded-md">
            <SelectValue placeholder="Edit Drawing" />
          </SelectTrigger>
          <SelectContent side="top">
            {sortedDrawings.map((drawing) => (
              <SelectItem key={drawing.id} value={String(drawing.id)}>
                {drawing.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const components: TLComponents = {
    QuickActions: SaveButton,
    NavigationPanel: SelectDrawing,
  };

  const sortedDrawings = [...drawings].sort((a, b) => {
    return a.filename.localeCompare(b.filename); // Ordina in ordine alfabetico
  });

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
            <Button type="submit" form="save-drawing-form">
              Save drawing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
