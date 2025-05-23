import {
  DefaultContextMenu,
  DefaultContextMenuContent,
  DefaultPageMenu,
  DefaultQuickActions,
  DefaultQuickActionsContent,
  TLComponents,
  TLUiContextMenuProps,
  TLUiStylePanelProps,
  Tldraw,
  TldrawUiMenuGroup,
  TldrawUiMenuItem,
  loadSnapshot,
  track,
  useEditor,
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
import { DrawingCollapsible } from "./Collapsible";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { executeQuery } from "@/lib/neo4j";
import { FlowForm } from "./FlowForm";
import { ApplicationForm } from "./ApplicationForm";
import { AppWindow, Link, Lock } from "lucide-react";
import { icons } from "@/assets/icons";
import { ApplicationShapeUtil } from "./custom_shapes/ApplicationShape";
import { getApplications, saveApplication, saveFlow } from "@/lib/neo4jUtils";

export function DrawingEditor() {
  const [selected, setSelected] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [drawings, setDrawings] = useState<any[]>([]);
  const [showFlowContext, setShowFlowContext] = useState(false);
  const editorRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isFlowDialogOpen, setIsFlowDialogOpen] = useState(false);
  const [flowFormData, setFlowFormData] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [dragDropApplications, setDragDropApplications] = useState<any[]>([]);
  const [isCollapseOpen, setIsCollapseOpen] = useState(false);
  const [isSVGCollapseOpen, setIsSVGCollapseOpen] = useState(false);
  const previousShapesRef = useRef<Record<string, any>>({});

  const [selectedShapes, setSelectedShapes] = useState<any>([]);
  const [selectedArrowId, setselectedArrowId] = useState<any>();

  useEffect(() => {
    fetchApplications();
    fetchDrawings();
  }, []);

  useEffect(() => {
    if (!setIsFlowDialogOpen) setFlowFormData({});
  }, [isFlowDialogOpen]);

  const fetchApplications = async () => {
    getApplications().then((result) => {
      if (result && result.length > 0) {
        const apps = result.map((r: any) => r.a);
        setApplications(apps);

        const transformedData = apps.map((item: any) => ({
          id: item.properties.application_id,
          name: item.properties.name,
          selected: false,
        }));

        setDragDropApplications(transformedData);
      } else {
        toast.error("Failed to load applications");
      }
    });
  };

  const fetchDrawings = async () => {
    const { data, error } = await supabase.from("ea-drawings").select("*");
    if (error) {
      console.error("Errore nel recupero dei drawings:", error.message);
    } else {
      setDrawings(data);
    }
  };

  function handleRemoveShape(id: string | number) {
    setDragDropApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, selected: false } : app))
    );
  }

  const ShapeRemoval = () => {
    const editor = useEditor();

    useEffect(() => {
      if (!editor) return;

      // Salva snapshot iniziale delle shape
      previousShapesRef.current = Object.fromEntries(
        editor.getCurrentPageShapes().map((s: any) => [s.id, s])
      );

      function onChange() {
        const currentShapes = Object.fromEntries(
          editor.getCurrentPageShapes().map((s: any) => [s.id, s])
        );

        // Trova shape che erano presenti prima ma ora non più
        const removedShapeIds = Object.keys(previousShapesRef.current).filter(
          (id) => !(id in currentShapes)
        );

        if (removedShapeIds.length > 0) {
          removedShapeIds.forEach((removedId) => {
            const cleanId = removedId.replace(/^shape:/, "");
            handleRemoveShape(cleanId);
          });
        }

        // Aggiorna snapshot
        previousShapesRef.current = currentShapes;
      }

      editor.on("change", onChange);

      return () => {
        editor.off("change", onChange);
      };
    }, [editor]);

    return null;
  };

  const ShapeListener = track(function MetaUiHelper() {
    const editor = useEditor();

    /*useEffect(() => {
      const getSelectedShapes = editor.getSelectedShapes();
      console.log(getSelectedShapes);
      setSelectedShapes(getSelectedShapes);
    }, [editor.getSelectedShapes().length]);*/

    const selectedShape = editor.getOnlySelectedShape();
    console.log(selectedShape)
    const type = selectedShape?.type;
    const shapeId = selectedShape?.id;
    const shapeMeta = selectedShape?.meta;

    if (type == "arrow") {
      setselectedArrowId(shapeId)
      setShowFlowContext(true);
    } else {
      setShowFlowContext(false);
    }
    return <></>;
  });

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
          focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500
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

  const handleApplicationSubmit = async (data: any) => {
    try {
      const transformedData = {
        ...data,
        ams_contact_phone: data.ams_contact_phone || "",
        ams_expire_date: data.ams_expire_date || null,
        ams_supplier: data.ams_supplier || "",
        ams_portal: data.ams_portal || "",
        links_to_documentation: data.links_to_documentation || "",
        ams_type: data.ams_type || "",
        decommission_date: data.decommission_date || null,
      };

      await handleSaveApplication(transformedData);
    } catch (error) {
      console.error("Error transforming data:", error);
      toast.error("Invalid format in one or more fields");
    }
  };

  const handleFlowSubmit = async (data: any) => {
    try {
      const transformedData = {
        ...data,
        //notes: data.notes ? JSON.stringify(data.notes.split(',').map(v => v.trim()).filter(Boolean)) : "[]",
        release_date: data.release_date || null,
      };

      //console.log("Data -> ", transformedData)
      await handleSaveFlow(transformedData);
    } catch (error) {
      console.error("Error transforming data:", error);
      toast.error("Invalid format in one or more fields");
    }
  };

  const handleSaveApplication = async (data: any) => {
    if (!data) return;

    setIsLoading(true);
    saveApplication(data).then((result) => {
      if (result && result.length > 0) {
        toast.success("Application added successfully");
        setIsApplicationDialogOpen(false);
      } else {
        toast.error("Failed to save application");
      }
      setIsLoading(false);
    }).finally(() => fetchApplications());
  };

  const handleSaveFlow = async (data: any) => {
    if (!data) return;

    setIsLoading(true);
    saveFlow(data).then((result) => {
      if (result && result.length > 0) {
        toast.success("Flow added successfully");
        setIsFlowDialogOpen(false);
      } else {
        toast.error("Failed to save flow");
      }
      setIsLoading(false);
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

        setSelected((prev: any) => ({
          ...prev,
          version: newVersion,
          drawings: snapshot,
        }));

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
        <div className="tlui-buttons__horizontal">
          <button
            type="button"
            onClick={handleUpdateDrawing}
            disabled={!selected}
            className="tlui-menu__item tlui-button tlui-button__menu tlui-button__default"
            title="Edit drawing"
          >
            <div
              className={"tlui-button__icon" + (!selected ? " opacity-50" : "")}
            >
              <img src="/svg/edit_icon.svg" alt="Edit" className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsDialogOpen(true)}
            className="tlui-menu__item tlui-button tlui-button__default"
            title="Save drawing"
          >
            <div className="tlui-button__icon">
              <img src="/svg/save_icon.svg" alt="Save" className="w-4 h-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsApplicationDialogOpen(true)}
            className="tlui-menu__item tlui-button tlui-button__default"
            title="New Application"
          >
            <div className="tlui-button__icon">
              <AppWindow className="h-4 w-4" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsFlowDialogOpen(true)}
            className="tlui-menu__item tlui-button tlui-button__default"
            title="New Flow"
          >
            <div className="tlui-button__icon">
              <Link className="h-4 w-4" />
            </div>
          </button>
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

  function CustomContextMenu(props: TLUiContextMenuProps) {
    return (
      <DefaultContextMenu {...props}>
        <TldrawUiMenuGroup id="flowContext">
          <div>
            {showFlowContext && (
              <TldrawUiMenuItem
                id="flow"
                label="Flusso EA"
                readonlyOk
                onSelect={() => {
                  const editor = editorRef.current;
                  if (!editor) return;

                  const shape = editor.getOnlySelectedShape();
                  if (!shape || shape.type !== "arrow") return;

                  const { x, y } = shape;
                  const { start, end } = shape.props;

                  // Recupera i due punti collegati
                  const allShapes = editor.getCurrentPageShapes();
                  const startX = x + start.x;
                  const startY = y + start.y;
                  const endX = x + end.x;
                  const endY = y + end.y;

                  const getClosestApplication = (xPos: number, yPos: number) =>
                    allShapes.find((s: any) => {
                      const isApp =
                        s.type === "application" &&
                        s.meta?.type === "application";
                      if (!isApp) return false;
                      const sx = s.x;
                      const sy = s.y;
                      const sw = s.props.w;
                      const sh = s.props.h;
                      return (
                        xPos >= sx &&
                        xPos <= sx + sw &&
                        yPos >= sy &&
                        yPos <= sy + sh
                      );
                    });

                  const startApp = getClosestApplication(startX, startY);
                  const endApp = getClosestApplication(endX, endY);

                  if (!startApp || !endApp) {
                    toast.error("Error loading app data");
                    return;
                  }

                  setFlowFormData({
                    initiator_application: startApp.meta.data.id,
                    target_application: endApp.meta.data.id,
                  });
                  setIsFlowDialogOpen(true);
                }}
              />
            )}
            {/*selectedShapes.length && (
              <TldrawUiMenuItem
                id="show_flows"
                label="Show Flows"
                readonlyOk
                onSelect={() => alert("test")}
              />
            )*/}
          </div>
        </TldrawUiMenuGroup>
        <DefaultContextMenuContent />
      </DefaultContextMenu>
    );
  }

  function Collapsibles(props: TLUiStylePanelProps) {
    return (
      <div
        className="p-2 absolute flex flex-col gap-[8px]"
        style={{ pointerEvents: "auto", top: "50px" }}
      >
        <DrawingCollapsible
          type="text"
          title="Applications"
          items={dragDropApplications}
          isOpen={isCollapseOpen}
          onToggle={(open: boolean) => setIsCollapseOpen(open)}
        />

        <DrawingCollapsible
          type="images"
          title="Icons"
          items={Object.values(icons)}
          isOpen={isSVGCollapseOpen}
          onToggle={(open: boolean) => setIsSVGCollapseOpen(open)}
          footer={(search) => (
            <a
              href={`https://fonts.google.com/icons?icon.query=${encodeURIComponent(
                search
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm"
            >
              Search on Google Icons
            </a>
          )}
        />
      </div>
    );
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const data = e.dataTransfer.getData("application/json");
    if (!data || !editorRef.current) return;

    const item = JSON.parse(data);
    const editor = editorRef.current;

    const bounds = (e.target as HTMLElement).getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    const point = editor.screenToPage({ x, y });

    // SVG
    if (item.svg) {
      const assetId = `asset:${crypto.randomUUID()}`;
      const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(item.svg)}`;

      editor.store.put([
        {
          id: assetId,
          typeName: "asset",
          type: "image",
          props: {
            src: svgDataUrl,
            mimeType: "image/svg+xml",
            w: 100,
            h: 100,
            name: `svg-${assetId}`,
            isAnimated: false,
          },

          meta: {},
        },
      ]);

      editor.createShape({
        id: `shape:${crypto.randomUUID()}`,
        type: "image",
        x: point.x,
        y: point.y,
        props: {
          assetId: assetId,
          w: 100,
          h: 100,
        },
      });

      return;
    }

    // Altrimenti crea una shape standard (applicazione)
    const existingShape = editor
      .getCurrentPageShapes()
      .find((shape: any) => shape.meta?.data?.id === item.id);

    if (existingShape) {
      return;
    }

    setDragDropApplications((prev) =>
      prev.map((app) =>
        app.id === item.id ? { ...app, selected: !app.selected } : app
      )
    );

    /*editor.createShape({
      id: `shape:${item.id}`,
      type: "geo",
      x: point.x,
      y: point.y,
      props: {
        geo: "rectangle",
        w: 250,
        h: 100,
        dash: "draw",
        fill: "none",
        color: "black",
        font: "sans",
        size: "m",
        text: item.name,
      },
      meta: {
        type: "application",
        data: item,
      },
    });*/

    editor.createShape({
      id: `shape:${item.id}`,
      type: "application", // custom type
      x: point.x,
      y: point.y,
      props: {
        w: 250,
        h: 100,
        name: item.name,
      },
      meta: {
        type: "application",
        data: item,
      },
    });
  }

  const components: TLComponents = {
    QuickActions: customActions,
    PageMenu: CustomPageMenu,
    ContextMenu: CustomContextMenu,
    InFrontOfTheCanvas: Collapsibles,
  };

  const sortedDrawings = [...drawings].sort((a, b) => {
    return a.filename.localeCompare(b.filename); // Ordina in ordine alfabetico
  });

  return (
    <>
      <div
        className="w-full h-full border rounded-lg bg-card overflow-hidden"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Tldraw
          shapeUtils={[ApplicationShapeUtil]}
          components={components}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
        >
          <ShapeListener />
          <ShapeRemoval />
        </Tldraw>
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

      <Dialog
        open={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
      >
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col z-[400]"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Add new application</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new application and add it to the network
            graph.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <ApplicationForm onSubmit={handleApplicationSubmit} data={{}} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsApplicationDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="application-form"
                disabled={isLoading}
              >
                Save application
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isFlowDialogOpen} onOpenChange={setIsFlowDialogOpen}>
        <DialogContent
          className="sm:max-w-[800px] h-[90vh] flex flex-col z-[400]"
          aria-describedby="dialog-description"
        >
          <DialogHeader>
            <DialogTitle>Add new flow</DialogTitle>
          </DialogHeader>
          <p id="dialog-description" className="sr-only">
            Use this form to create a new flow.
          </p>
          <ScrollArea className="flex-1 px-4">
            <div className="py-4">
              <FlowForm onSubmit={handleFlowSubmit} data={flowFormData} />
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4 w-full">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFlowDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" form="flow-form" disabled={isLoading}>
                Save flow
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
