import {
  DefaultPageMenu,
  DefaultQuickActions,
  DefaultQuickActionsContent,
  TLComponents,
  TLUiAssetUrlOverrides,
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

  function customActions() {

    const handleUpdateDrawing = async () => {
      const editor = editorRef.current;
      if (!selected || !editor) return;

      try {
        const snapshot = editor.store.getSnapshot();
        const { version, id } = selected;
        const newVersion = version + 1;

        const { data, error } = await supabase
          .from("ea-drawings")
          .update({ drawings: snapshot, version: newVersion })
          .eq("id", id)
          .select();

        if (error) throw error;

        setSelected((prev: any) => ({ ...prev, version: newVersion, drawings: snapshot }));

        toast.success("Drawing updated");
        fetchDrawings();
      } catch (err) {
        console.error("Errore aggiornamento:", err);
        toast.error("Error editing drawing");
      }
    };

    return (
      <DefaultQuickActions>
        <DefaultQuickActionsContent />
        <div className="flex">
          <TldrawUiMenuItem
            onSelect={() => handleUpdateDrawing()}
            disabled={!selected}
            id="update"
            icon="send-to-back"
            label="Update drawing"
          />

          <TldrawUiMenuItem
            id="save"
            icon="bring-to-front"
            onSelect={() => setIsDialogOpen(true)}
            label="Save new drawing"
          />
        </div>
      </DefaultQuickActions>
    );
  }

  function CustomPageMenu() {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <SelectDrawing />

        <DefaultPageMenu />
      </div>
    );
  }

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

    return (
      <div
        //className="absolute bottom-3 right-2 z-[1000] flex flex-row items-center bg-none rounded-md"
        style={{ pointerEvents: "auto" }}
      >

        <Select
          onValueChange={handleSelectChange}
          value={selected ? String(selected.id) : undefined}
        >
          <SelectTrigger
            aria-label="Select Drawing"
            className="
          flex items-center justify-between
          h-8
          px-2
          ml-2
          rounded-md
          bg-transparent
          text-sm font-sm
          text-gray-700
          hover:bg-gray-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
          border border-transparent
          cursor-pointer
          min-w-[180px]
        "
          >
            <SelectValue placeholder="New Drawing" />
          </SelectTrigger>

          <SelectContent
            side="bottom"
            align="start"
            className="max-h-48 w-100 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
          >
            {sortedDrawings.map((drawing) => (
              <SelectItem
                key={drawing.id}
                value={String(drawing.id)}
                className="text-sm"
              >
                {drawing.filename}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  const components: TLComponents = {
    QuickActions: customActions,
    //NavigationPanel: SelectDrawing,
    PageMenu: CustomPageMenu,
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
